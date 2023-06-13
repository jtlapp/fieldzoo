import { Kysely, SelectQueryBuilder, sql } from "kysely";

import {
  KeyDataType,
  KeyType,
  PermissionsTableConfig,
} from "./permissions-table-config";
import { PermissionsResult } from "./permissions-result";

// TODO: look at using sql.id or sql.ref instead of catting

// TODO: rename ResourceTableName and UserTableName to drop 'Name'

// TODO: support public permissionss

// TODO: look at making owners optional

/**
 * Class representing user permissions to resources indicated by rows in a
 * resources table. Each resource has an owner who also has full permissions,
 * regardless of whether the permissions table assigns permissions to the
 * owner. Permissions are merely numbers, so they can be used to represent
 * permissionss or privilege flags, etc.
 */
export class PermissionsTable<
  UserTableName extends string,
  UserKeyDT extends KeyDataType,
  ResourceTableName extends string,
  ResourceKeyDT extends KeyDataType,
  Permissions extends number,
  UserKey extends KeyType<UserKeyDT> = KeyType<UserKeyDT>,
  ResourceKey extends KeyType<ResourceKeyDT> = KeyType<ResourceKeyDT>
> {
  private readonly config: Readonly<
    PermissionsTableConfig<
      UserTableName,
      UserKeyDT,
      ResourceTableName,
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
      UserTableName,
      UserKeyDT,
      ResourceTableName,
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
   * Creates a permissions table for the given resource table. Permissions
   * table rows are deleted when the associated user or resource is deleted.
   */
  async create(db: Kysely<any>) {
    await db.schema
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
      .addUniqueConstraint(`${this.tableName}_key`, ["userKey", "resourceKey"])
      .execute();
  }

  /**
   * Drops the permissions table for the given resource table.
   */
  async drop(db: Kysely<any>) {
    await db.schema.dropTable(this.tableName).execute();
  }

  // TODO: maybe return an isOwner field with all results

  // TODO: Need a method for getting all resources to which user has permissions

  async getPermissions<DB>(
    db: Kysely<DB>,
    userKey: UserKey,
    resourceKey: ResourceKey
  ): Promise<Permissions> {
    const query = this.getPermissionsQuery(
      db,
      userKey,
      (query, resourceKeyColumn) =>
        query.where(db.dynamic.ref(resourceKeyColumn), "=", resourceKey)
    );
    const result = await query.executeTakeFirst();
    return result === undefined
      ? (0 as Permissions)
      : (result.permissions as Permissions);
  }

  async getPermissionsWhere<DB, TB extends keyof DB & ResourceTableName, O>(
    db: Kysely<DB>,
    userKey: UserKey,
    queryModifier: (
      query: SelectQueryBuilder<
        DB,
        TB,
        PermissionsResult<Permissions, ResourceKey>
      >,
      resourceKeyColumn: string
    ) => SelectQueryBuilder<DB, TB, O>
  ): Promise<O[]> {
    const query = this.getPermissionsQuery(db, userKey, queryModifier);
    return query.execute();
  }

  async getMultiplePermissions<DB>(
    db: Kysely<DB>,
    userKey: UserKey,
    resourceKeys: ResourceKey[]
  ): Promise<PermissionsResult<Permissions, ResourceKey>[]> {
    const query = this.getPermissionsQuery(
      db,
      userKey,
      (query, resourceKeyColumn) =>
        query.where(db.dynamic.ref(resourceKeyColumn), "in", resourceKeys)
    );
    return query.execute();
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
  async setPermissions(
    db: Kysely<any>,
    userKey: UserKey,
    resourceKey: ResourceKey,
    permissions: Permissions
  ) {
    if (permissions === 0) {
      await db
        .deleteFrom(this.tableName as keyof any & string)
        .where("userKey", "=", userKey)
        .where("resourceKey", "=", resourceKey)
        .execute();
    } else {
      await db
        .insertInto(this.tableName as keyof any & string)
        .values({
          userKey,
          resourceKey,
          permissions,
        })
        .execute();
    }
  }

  private getPermissionsQuery<DB, TB extends keyof DB & ResourceTableName, O>(
    db: Kysely<DB>,
    userKey: UserKey,
    queryModifier: (
      query: SelectQueryBuilder<
        DB,
        TB,
        PermissionsResult<Permissions, ResourceKey>
      >,
      resourceKeyColumn: string
    ) => SelectQueryBuilder<DB, TB, O>
  ) {
    const ref = db.dynamic.ref.bind(db.dynamic);
    const foreignResourceOwnerKeyColumnRef = ref(
      this.foreignResourceOwnerKeyColumn
    );

    return queryModifier(
      db
        .selectFrom(this.config.resourceTableName as unknown as TB)
        .select([
          sql.ref(this.foreignResourceKeyColumn).as("resourceKey"),
          sql.lit(this.config.ownerPermissions).as("permissions"),
        ])
        .where(
          foreignResourceOwnerKeyColumnRef,
          "=",
          userKey
        ) as SelectQueryBuilder<
        DB,
        TB,
        PermissionsResult<Permissions, ResourceKey>
      >,
      this.foreignResourceKeyColumn
    ).unionAll(
      queryModifier(
        db
          .selectFrom(this.tableName as keyof DB & string)
          .select([
            sql.ref(this.internalResourceKeyColumn).as("resourceKey"),
            sql
              .ref<Permissions>(this.internalPermissionsColumn)
              .as("permissions"),
          ])
          // Including the contrary condition prevents UNION ALL duplicates
          // and allows the database to short-circuit if 1st condition holds.
          .where(foreignResourceOwnerKeyColumnRef, "!=", userKey)
          .where(
            ref(this.internalUserKeyColumn),
            "=",
            userKey
          ) as SelectQueryBuilder<
          DB,
          TB,
          PermissionsResult<Permissions, ResourceKey>
        >,
        this.internalResourceKeyColumn
      )
    );
  }

  // Alternative implementation using a left join instead of a union. Keeping
  // around for possible performance testing later.

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
