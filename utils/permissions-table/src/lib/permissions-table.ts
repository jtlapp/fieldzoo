import { Kysely, SelectQueryBuilder, sql } from "kysely";

import {
  KeyDataType,
  KeyType,
  PermissionsTableConfig,
} from "./permissions-table-config";
import { PermissionsResult } from "./permissions-result";

// TODO: look at making owners optional

/**
 * Class representing user permissions to resources indicated by rows in a
 * resources table. Each resource has an owner having permissions, regardless
 * of whether the permissions table explicitly assigns permissions to the
 * owner. Permissions are merely numbers, so they can be used to represent
 * permissionss or privilege flags, etc.
 */
export class PermissionsTable<
  UserTable extends string,
  UserKeyDT extends KeyDataType,
  ResourceTable extends string,
  ResourceKeyDT extends KeyDataType,
  Permissions extends number,
  UserKey extends KeyType<UserKeyDT> = KeyType<UserKeyDT>,
  ResourceKey extends KeyType<ResourceKeyDT> = KeyType<ResourceKeyDT>
> {
  private readonly config: Readonly<
    PermissionsTableConfig<
      UserTable,
      UserKeyDT,
      ResourceTable,
      ResourceKeyDT,
      Permissions,
      UserKey,
      ResourceKey
    >
  >;
  // cache values to improve performance
  private readonly tableName: string;
  private readonly foreignUserKeyColumn: string;
  private readonly foreignResourceKeyColumn: string;
  private readonly foreignResourceOwnerKeyColumn: string;
  private readonly internalUserKeyColumn: string;
  private readonly internalResourceKeyColumn: string;
  private readonly internalPermissionsColumn: string;

  constructor(
    config: PermissionsTableConfig<
      UserTable,
      UserKeyDT,
      ResourceTable,
      ResourceKeyDT,
      Permissions,
      UserKey,
      ResourceKey
    >
  ) {
    this.config = { ...config }; // avoid trouble
    this.foreignUserKeyColumn = `${config.userTableName}.${config.userKeyColumn}`;
    this.foreignResourceKeyColumn = `${config.resourceTableName}.${config.resourceKeyColumn}`;
    this.foreignResourceOwnerKeyColumn = `${config.resourceTableName}.${config.resourceOwnerKeyColumn}`;
    this.tableName = `${config.resourceTableName}_permissions`;
    this.internalUserKeyColumn = `${this.tableName}.userKey`;
    this.internalResourceKeyColumn = `${this.tableName}.resourceKey`;
    this.internalPermissionsColumn = `${this.tableName}.permissions`;
  }

  /**
   * Returns a CreateTableBuilder for creating a permissions table for the
   * configured resource table. Permissions table rows are deleted when the
   * associated user or resource is deleted (cascading on delete).
   * @param db Database connection.
   */
  construct(db: Kysely<any>) {
    return db.schema
      .createTable(this.tableName)
      .addColumn("userKey", this.config.userKeyDataType, (col) =>
        col.notNull().references(this.foreignUserKeyColumn).onDelete("cascade")
      )
      .addColumn("resourceKey", this.config.resourceKeyDataType, (col) =>
        col
          .notNull()
          .references(this.foreignResourceKeyColumn)
          .onDelete("cascade")
      )
      .addColumn("permissions", "integer", (col) => col.notNull())
      .addUniqueConstraint(`${this.tableName}_key`, ["userKey", "resourceKey"]);
  }

  /**
   * Drops the permissions table for the given resource table, if it exists.
   * @param db Database connection.
   */
  async drop(db: Kysely<any>) {
    await db.schema.dropTable(this.tableName).ifExists().execute();
  }

  /**
   * Returns the permissions a user has to a resource, returning 0 if the
   * user has no permissions, and returning the configured owner permissions
   * if the user is the owner of the resource.
   * @param db Database connection.
   * @param userKey Key of user to get permissions for.
   * @param resourceKey Key of resource to get permissions for.
   * @returns The permissions the user has to the resource.
   */
  async getPermissions<DB>(
    db: Kysely<DB>,
    userKey: UserKey,
    resourceKey: ResourceKey
  ): Promise<Permissions>;

  /**
   * Returns the permissions a user has to a list of resources, returning one
   * entry for each resource, including resources with 0 permissions. Returns
   * the configured owner permissions if the user is the owner of a resource.
   * @param db Database connection.
   * @param userKey Key of user to get permissions for.
   * @param resourceKey Keys of resources to get permissions for.
   * @returns The permissions the user has to the resources.
   */
  async getPermissions<DB>(
    db: Kysely<DB>,
    userKey: UserKey,
    resourceKeys: ResourceKey[]
  ): Promise<PermissionsResult<ResourceKey, Permissions>[]>;

  async getPermissions<DB>(
    db: Kysely<DB>,
    userKey: UserKey,
    resourceKeyOrKeys: ResourceKey | ResourceKey[]
  ): Promise<Permissions | PermissionsResult<ResourceKey, Permissions>[]> {
    if (Array.isArray(resourceKeyOrKeys)) {
      const sortedResourceKeys = resourceKeyOrKeys.slice().sort();
      const results = await this.getPermissionsQuery(
        db,
        userKey,
        (query, resourceKeyColumn) =>
          query.where(
            db.dynamic.ref(resourceKeyColumn),
            "in",
            sortedResourceKeys
          )
      )
        .orderBy(db.dynamic.ref("resourceKey"))
        .execute();

      const permissions = new Array<
        PermissionsResult<ResourceKey, Permissions>
      >(resourceKeyOrKeys.length);
      let resultIndex = 0;
      for (let i = 0; i < sortedResourceKeys.length; ++i) {
        const sourceResourceKey = sortedResourceKeys[i];
        const result = results[resultIndex];
        if (result !== undefined && result.resourceKey === sourceResourceKey) {
          permissions[i] = result;
          ++resultIndex;
        } else {
          permissions[i] = {
            resourceKey: sourceResourceKey,
            permissions: 0 as Permissions,
          };
        }
      }
      return permissions;
    } else {
      const query = this.getPermissionsQuery(
        db,
        userKey,
        (query, resourceKeyColumn) =>
          query.where(db.dynamic.ref(resourceKeyColumn), "=", resourceKeyOrKeys)
      );
      const result = await query.executeTakeFirst();
      return result === undefined
        ? (0 as Permissions)
        : (result.permissions as Permissions);
    }
  }

  /**
   * Returns a query that returns the permissions a user has to a resource,
   * returning 0 if the user has no permissions, and returning the configured
   * owner permissions if the user is the owner of the resource.
   * @param db Database connection.
   * @param userKey Key of user to get permissions for.
   * @param resourceSelector Function that returns a query selecting the
   *  resource or resources to get permissions for. Its first argument is a
   *  query that selects from the resources table, and its second argument is
   *  the name of the resource key column to use for selecting resources.
   * @returns A query that returns the permissions the user has to the
   *  resource.
   */
  getPermissionsQuery<DB, TB extends keyof DB & ResourceTable, O>(
    db: Kysely<DB>,
    userKey: UserKey,
    resourceSelector: (
      query: SelectQueryBuilder<
        DB,
        TB,
        PermissionsResult<ResourceKey, Permissions>
      >,
      resourceKeyColumn: string
    ) => SelectQueryBuilder<DB, TB, O>
  ) {
    const ref = db.dynamic.ref.bind(db.dynamic);
    return resourceSelector(
      db
        .selectFrom(this.config.resourceTableName as unknown as TB)
        .select([
          sql.ref(this.foreignResourceKeyColumn).as("resourceKey"),
          sql.lit(this.config.ownerPermissions).as("permissions"),
        ])
        .where(
          ref(this.foreignResourceOwnerKeyColumn),
          "=",
          userKey
        ) as SelectQueryBuilder<
        DB,
        TB,
        PermissionsResult<ResourceKey, Permissions>
      >,
      this.foreignResourceKeyColumn
    ).unionAll(
      resourceSelector(
        db
          .selectFrom(this.tableName as keyof DB & string)
          .select([
            sql.ref(this.internalResourceKeyColumn).as("resourceKey"),
            sql
              .ref<Permissions>(this.internalPermissionsColumn)
              .as("permissions"),
          ])
          .where(
            ref(this.internalUserKeyColumn),
            "=",
            userKey
          ) as SelectQueryBuilder<
          DB,
          TB,
          PermissionsResult<ResourceKey, Permissions>
        >,
        this.internalResourceKeyColumn
      )
    );
  }

  /**
   * Returns the name of the permissions table.
   * @returns The name of the permissions table.
   */
  getTableName<DB, TB extends keyof DB & string>(): TB {
    return this.tableName as TB;
  }

  /**
   * Sets the permissions of a user to the given resource. Setting an access
   * level of 0 removes the user's permissions assignment.
   * @param db Database instance.
   * @param userKey Key of user to grant access to.
   * @param resourceKey Key of resource to grant access to.
   * @param permissions Access level to assign.
   */
  async setPermissions<DB, TB extends keyof DB & string>(
    db: Kysely<DB>,
    userKey: UserKey,
    resourceKey: ResourceKey,
    permissions: Permissions
  ) {
    db.getExecutor().adapter;
    const ref = db.dynamic.ref.bind(db.dynamic);
    if (permissions === 0) {
      await db
        .deleteFrom(this.tableName as TB)
        .where(ref("userKey"), "=", userKey)
        .where(ref("resourceKey"), "=", resourceKey)
        .execute();
    } else {
      switch (this.config.databaseSyntax) {
        case "postgres":
          await db
            .insertInto(this.tableName as TB)
            .values({ userKey, resourceKey, permissions } as any)
            .onConflict(
              (oc) =>
                oc
                  .constraint(`${this.tableName}_key`)
                  .doUpdateSet({ permissions } as any) as any
            )
            .execute();
          return;
        case "mysql":
        case "sqlite":
          await db
            .replaceInto(this.tableName as TB)
            .values({ userKey, resourceKey, permissions } as any)
            .execute();
          return;
        default:
          throw Error(
            `Unsupported database syntax: ${this.config.databaseSyntax}`
          );
      }
    }
  }

  // Alternative implementation using a left join instead of a union. Keeping
  // around for possible performance testing later.
  // TODO: decide whether to use this

  // getPermissionsQuery2<DB>(
  //   db: Kysely<DB>,
  //   userKey: UserKey,
  //   resourceKeys: ResourceKey | ResourceKey[],
  //   resourceKeyComparer: "=" | "in"
  // ) {
  //   const ref = db.dynamic.ref.bind(db.dynamic);
  //   const foreignResourceKeyColumnRef = ref(this.foreignResourceKeyColumn);

  //   return db
  //     .selectFrom(this.config.resourceTableName as unknown as keyof DB & string)
  //     .select([
  //       sql.ref(this.foreignResourceKeyColumn).as("resourceKey"),
  //       db.fn
  //         .coalesce(
  //           ref(this.internalPermissionsColumn),
  //           sql.lit(this.config.ownerPermissions)
  //         )
  //         .as("permissions"),
  //     ])
  //     .where(foreignResourceKeyColumnRef, resourceKeyComparer, resourceKeys)
  //     .leftJoin(this.tableName as keyof DB & string, (join) =>
  //       join
  //         .on(ref(this.internalUserKeyColumn), "=", userKey)
  //         .onRef(
  //           ref(this.internalResourceKeyColumn),
  //           "=",
  //           foreignResourceKeyColumnRef
  //         )
  //     )
  //     .where(
  //       sql`${sql.ref(this.foreignResourceOwnerKeyColumn)} = ${userKey} or
  //         ${sql.ref(this.internalPermissionsColumn)} is not null`
  //     );
  // }
}
