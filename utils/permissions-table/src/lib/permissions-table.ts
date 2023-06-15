import { Kysely, SelectQueryBuilder, sql } from "kysely";

import {
  KeyDataType,
  PrimitiveKeyType,
  PermissionsTableConfig,
} from "./permissions-table-config";
import { PermissionsResult } from "./permissions-result";

// TODO: rename UserID/ResourceID to UserID/ResourceID but not the *KeyDT types

// TODO: look at making owners optional

// TODO: I can make permissions checks more efficient by requiring them to
// indicate owner permissions, which then also makes owners optional and
// managed outside this library.

/**
 * Class representing user permissions to resources indicated by rows in a
 * resources table. Each resource has an owner having permissions, regardless
 * of whether the permissions table explicitly assigns permissions to the
 * owner. Permissions are merely numbers, so they can be used to represent
 * permissionss or privilege flags, etc.
 */
export class PermissionsTable<
  UserTable extends string,
  UserIDDataType extends KeyDataType,
  ResourceTable extends string,
  ResourceIDDataType extends KeyDataType,
  Permissions extends number,
  UserID extends PrimitiveKeyType<UserIDDataType> = PrimitiveKeyType<UserIDDataType>,
  ResourceID extends PrimitiveKeyType<ResourceIDDataType> = PrimitiveKeyType<ResourceIDDataType>
> {
  private readonly config: Readonly<
    PermissionsTableConfig<
      UserTable,
      UserIDDataType,
      ResourceTable,
      ResourceIDDataType,
      Permissions,
      UserID,
      ResourceID
    >
  >;
  // cache values to improve performance
  private readonly tableName: string;
  private readonly foreignUserIDColumn: string;
  private readonly foreignResourceIDColumn: string;
  private readonly foreignResourceOwnerKeyColumn: string;
  private readonly internalUserIDColumn: string;
  private readonly internalResourceIDColumn: string;
  private readonly internalPermissionsColumn: string;

  constructor(
    config: PermissionsTableConfig<
      UserTable,
      UserIDDataType,
      ResourceTable,
      ResourceIDDataType,
      Permissions,
      UserID,
      ResourceID
    >
  ) {
    this.config = { ...config }; // avoid trouble
    this.foreignUserIDColumn = `${config.userTable}.${config.userIDColumn}`;
    this.foreignResourceIDColumn = `${config.resourceTable}.${config.resourceIDColumn}`;
    this.foreignResourceOwnerKeyColumn = `${config.resourceTable}.${config.resourceOwnerKeyColumn}`;
    this.tableName = `${config.resourceTable}_permissions`;
    this.internalUserIDColumn = `${this.tableName}.userID`;
    this.internalResourceIDColumn = `${this.tableName}.resourceID`;
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
      .addColumn("userID", this.config.userIDDataType, (col) =>
        col.notNull().references(this.foreignUserIDColumn).onDelete("cascade")
      )
      .addColumn("resourceID", this.config.resourceIDDataType, (col) =>
        col
          .notNull()
          .references(this.foreignResourceIDColumn)
          .onDelete("cascade")
      )
      .addColumn("permissions", "integer", (col) => col.notNull())
      .addUniqueConstraint(`${this.tableName}_key`, ["userID", "resourceID"]);
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
   * @param userID Key of user to get permissions for.
   * @param resourceID Key of resource to get permissions for.
   * @returns The permissions the user has to the resource.
   */
  async getPermissions<DB>(
    db: Kysely<DB>,
    userID: UserID,
    resourceID: ResourceID
  ): Promise<Permissions>;

  /**
   * Returns the permissions a user has to a list of resources, returning one
   * entry for each resource, including resources with 0 permissions. Returns
   * the configured owner permissions if the user is the owner of a resource.
   * @param db Database connection.
   * @param userID Key of user to get permissions for.
   * @param resourceID Keys of resources to get permissions for.
   * @returns The permissions the user has to the resources.
   */
  async getPermissions<DB>(
    db: Kysely<DB>,
    userID: UserID,
    resourceIDs: ResourceID[]
  ): Promise<PermissionsResult<ResourceID, Permissions>[]>;

  async getPermissions<DB>(
    db: Kysely<DB>,
    userID: UserID,
    resourceIDOrKeys: ResourceID | ResourceID[]
  ): Promise<Permissions | PermissionsResult<ResourceID, Permissions>[]> {
    if (Array.isArray(resourceIDOrKeys)) {
      const sortedResourceIDs = resourceIDOrKeys.slice().sort();
      const results = await this.getPermissionsQuery(
        db,
        userID,
        (query, resourceIDColumn) =>
          query.where(db.dynamic.ref(resourceIDColumn), "in", sortedResourceIDs)
      )
        .orderBy(db.dynamic.ref("resourceID"))
        .execute();

      const permissions = new Array<PermissionsResult<ResourceID, Permissions>>(
        resourceIDOrKeys.length
      );
      let resultIndex = 0;
      for (let i = 0; i < sortedResourceIDs.length; ++i) {
        const sourceResourceID = sortedResourceIDs[i];
        const result = results[resultIndex];
        if (result !== undefined && result.resourceID === sourceResourceID) {
          permissions[i] = result;
          ++resultIndex;
        } else {
          permissions[i] = {
            resourceID: sourceResourceID,
            permissions: 0 as Permissions,
          };
        }
      }
      return permissions;
    } else {
      const query = this.getPermissionsQuery(
        db,
        userID,
        (query, resourceIDColumn) =>
          query.where(db.dynamic.ref(resourceIDColumn), "=", resourceIDOrKeys)
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
   * @param userID Key of user to get permissions for.
   * @param resourceSelector Function that returns a query selecting the
   *  resource or resources to get permissions for. Its first argument is a
   *  query that selects from the resources table, and its second argument is
   *  the name of the resource key column to use for selecting resources.
   * @returns A query that returns the permissions the user has to the
   *  resource.
   */
  getPermissionsQuery<DB, TB extends keyof DB & ResourceTable, O>(
    db: Kysely<DB>,
    userID: UserID,
    resourceSelector: (
      query: SelectQueryBuilder<
        DB,
        TB, // TODO: this is now wrong for 2nd half of union
        PermissionsResult<ResourceID, Permissions>
      >,
      resourceIDColumn: string
    ) => SelectQueryBuilder<DB, TB, O>
  ) {
    const ref = db.dynamic.ref.bind(db.dynamic);
    return resourceSelector(
      db
        .selectFrom(this.config.resourceTable as unknown as TB)
        .select([
          sql.ref(this.foreignResourceIDColumn).as("resourceID"),
          sql.lit(this.config.ownerPermissions).as("permissions"),
        ])
        .where(
          ref(this.foreignResourceOwnerKeyColumn),
          "=",
          userID
        ) as SelectQueryBuilder<
        DB,
        TB,
        PermissionsResult<ResourceID, Permissions>
      >,
      this.foreignResourceIDColumn
    ).unionAll(
      resourceSelector(
        db
          .selectFrom(this.tableName as keyof DB & string)
          .select([
            sql.ref(this.internalResourceIDColumn).as("resourceID"),
            sql
              .ref<Permissions>(this.internalPermissionsColumn)
              .as("permissions"),
          ])
          .where(
            ref(this.internalUserIDColumn),
            "=",
            userID
          ) as SelectQueryBuilder<
          DB,
          TB,
          PermissionsResult<ResourceID, Permissions>
        >,
        this.internalResourceIDColumn
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
   * @param userID Key of user to grant access to.
   * @param resourceID Key of resource to grant access to.
   * @param permissions Access level to assign.
   */
  async setPermissions<DB, TB extends keyof DB & string>(
    db: Kysely<DB>,
    userID: UserID,
    resourceID: ResourceID,
    permissions: Permissions
  ) {
    db.getExecutor().adapter;
    const ref = db.dynamic.ref.bind(db.dynamic);
    if (permissions === 0) {
      await db
        .deleteFrom(this.tableName as TB)
        .where(ref("userID"), "=", userID)
        .where(ref("resourceID"), "=", resourceID)
        .execute();
    } else {
      switch (this.config.databaseSyntax) {
        case "postgres":
          await db
            .insertInto(this.tableName as TB)
            .values({ userID, resourceID, permissions } as any)
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
            .values({ userID, resourceID, permissions } as any)
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
  //   userID: UserID,
  //   resourceIDs: ResourceID | ResourceID[],
  //   resourceIDComparer: "=" | "in"
  // ) {
  //   const ref = db.dynamic.ref.bind(db.dynamic);
  //   const foreignResourceIDColumnRef = ref(this.foreignResourceIDColumn);

  //   return db
  //     .selectFrom(this.config.resourceTable as unknown as keyof DB & string)
  //     .select([
  //       sql.ref(this.foreignResourceIDColumn).as("resourceID"),
  //       db.fn
  //         .coalesce(
  //           ref(this.internalPermissionsColumn),
  //           sql.lit(this.config.ownerPermissions)
  //         )
  //         .as("permissions"),
  //     ])
  //     .where(foreignResourceIDColumnRef, resourceIDComparer, resourceIDs)
  //     .leftJoin(this.tableName as keyof DB & string, (join) =>
  //       join
  //         .on(ref(this.internalUserIDColumn), "=", userID)
  //         .onRef(
  //           ref(this.internalResourceIDColumn),
  //           "=",
  //           foreignResourceIDColumnRef
  //         )
  //     )
  //     .where(
  //       sql`${sql.ref(this.foreignResourceOwnerKeyColumn)} = ${userID} or
  //         ${sql.ref(this.internalPermissionsColumn)} is not null`
  //     );
  // }
}
