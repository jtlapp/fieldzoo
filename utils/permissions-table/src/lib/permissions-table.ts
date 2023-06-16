import { Kysely, SelectQueryBuilder, sql } from "kysely";

import {
  DatabaseSyntax,
  KeyDataType,
  PrimitiveKeyType,
  PermissionsTableConfig,
} from "./permissions-table-config";
import { PermissionsResult } from "./permissions-result";

// TODO: revise comments

// TODO: consider putting public access level in resource row so resources
// can be retrieved for the public without a join (I don't actually know if
// I can use null in the permissions table).

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
  ResourceID extends PrimitiveKeyType<ResourceIDDataType> = PrimitiveKeyType<ResourceIDDataType>,
  TableName extends string = `${ResourceTable}_permissions`
> implements
    PermissionsTableConfig<
      UserTable,
      UserIDDataType,
      ResourceTable,
      ResourceIDDataType,
      Permissions,
      UserID,
      ResourceID,
      TableName
    >
{
  // copy of PermissionsTableConfig properties
  readonly databaseSyntax!: DatabaseSyntax;
  readonly tableName: TableName;
  readonly maxPublicPermissions!: Permissions;
  readonly maxUserGrantedPermissions!: Permissions;
  readonly userTable!: UserTable;
  readonly userIDColumn!: string;
  readonly userIDDataType!: UserIDDataType;
  readonly resourceTable!: ResourceTable;
  readonly resourceIDColumn!: string;
  readonly resourceIDDataType!: ResourceIDDataType;

  // cache these values to improve performance
  private readonly foreignUserIDColumn: string;
  private readonly foreignResourceIDColumn: string;
  private readonly internalGrantedToColumn: string;
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
    Object.assign(this, config); // copy in case supplied config is changed
    this.tableName ??= `${config.resourceTable}_permissions` as TableName;
    this.foreignUserIDColumn = `${config.userTable}.${config.userIDColumn}`;
    this.foreignResourceIDColumn = `${config.resourceTable}.${config.resourceIDColumn}`;
    this.internalGrantedToColumn = `${this.tableName}.grantedTo`;
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
      .addColumn("grantedTo", this.userIDDataType, (col) => {
        col = col.references(this.foreignUserIDColumn).onDelete("cascade");
        return this.maxPublicPermissions === 0 ? col.notNull() : col;
      })
      .addColumn("resourceID", this.resourceIDDataType, (col) =>
        col
          .notNull()
          .references(this.foreignResourceIDColumn)
          .onDelete("cascade")
      )
      .addColumn("permissions", "integer", (col) => col.notNull())
      .addColumn("grantedAt", "timestamp", (col) =>
        col.notNull().defaultTo(sql`now()`)
      )
      .addColumn("grantedBy", this.userIDDataType, (col) =>
        col.references(this.foreignUserIDColumn)
      )
      .addUniqueConstraint(`${this.tableName}_key`, [
        "grantedTo",
        "resourceID",
      ]);
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
   * @param userID ID of user to get permissions for; null for public user.
   * @param resourceID Key of resource to get permissions for.
   * @returns The permissions the user has to the resource.
   */
  async getPermissions<DB>(
    db: Kysely<DB>,
    grantedTo: UserID | null,
    resourceID: ResourceID
  ): Promise<Permissions>;

  /**
   * Returns the permissions a user has to a list of resources, returning one
   * entry for each resource, including resources with 0 permissions. Returns
   * the configured owner permissions if the user is the owner of a resource.
   * @param db Database connection.
   * @param userID ID of user to get permissions for; null for public user.
   * @param resourceID Keys of resources to get permissions for.
   * @returns The permissions the user has to the resources.
   */
  async getPermissions<DB>(
    db: Kysely<DB>,
    grantedTo: UserID | null,
    resourceIDs: ResourceID[]
  ): Promise<PermissionsResult<ResourceID, Permissions>[]>;

  async getPermissions<DB>(
    db: Kysely<DB>,
    grantedTo: UserID | null,
    resourceIDOrKeys: ResourceID | ResourceID[]
  ): Promise<Permissions | PermissionsResult<ResourceID, Permissions>[]> {
    // TODO: undefined permissions needs to default to public
    if (Array.isArray(resourceIDOrKeys)) {
      const sortedResourceIDs = resourceIDOrKeys.slice().sort();
      const results = await this.getPermissionsQuery(db, grantedTo)
        .where(
          db.dynamic.ref(this.internalResourceIDColumn),
          "in",
          sortedResourceIDs
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
          result.permissions = this._toSafePermissions(
            grantedTo,
            result.permissions,
            result.grantedBy
          );
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
      const query = this.getPermissionsQuery(db, grantedTo).where(
        db.dynamic.ref(this.internalResourceIDColumn),
        "=",
        resourceIDOrKeys
      );
      const result = await query.executeTakeFirst();
      return result === undefined
        ? (0 as Permissions)
        : this._toSafePermissions(
            grantedTo,
            result.permissions,
            result.grantedBy
          );
    }
  }

  /**
   * Returns a query that returns the permissions a user has to a resource,
   * returning 0 if the user has no permissions, and returning the configured
   * owner permissions if the user is the owner of the resource.
   * @param db Database connection.
   * @param userID ID of user to get permissions for; null for public user.
   * @param resourceSelector Function that returns a query selecting the
   *  resource or resources to get permissions for. Its first argument is a
   *  query that selects from the resources table, and its second argument is
   *  the name of the resource key column to use for selecting resources.
   * @returns A query that returns the permissions the user has to the
   *  resource.
   */
  getPermissionsQuery<DB, TB extends keyof DB & TableName>(
    db: Kysely<DB>,
    grantedTo: UserID | null
  ) {
    const baseQuery = db
      .selectFrom(this.tableName as unknown as TB)
      .select([
        sql.ref(this.internalResourceIDColumn).as("resourceID"),
        sql.ref<Permissions>(this.internalPermissionsColumn).as("permissions"),
        sql.ref("grantedBy").as("grantedBy"),
      ]);
    const query =
      grantedTo === null
        ? baseQuery.where(
            db.dynamic.ref(this.internalGrantedToColumn),
            "is",
            null
          )
        : baseQuery.where(
            db.dynamic.ref(this.internalGrantedToColumn),
            "=",
            grantedTo
          );
    return query as SelectQueryBuilder<
      DB,
      TB,
      PermissionsResult<ResourceID, Permissions> & { grantedBy: UserID | null }
    >;
  }

  /**
   * Returns the name of the permissions table.
   * @returns The name of the permissions table.
   */
  getTableName<DB, TB extends keyof DB & TableName>(): TB {
    return this.tableName as unknown as TB;
  }

  /**
   * Removes a permissions grant.
   * @param db Database connection.
   * @param userID ID of user to remove grant for; null for public user.
   * @param resourceID Key of resource to remove grant for.
   */
  async removePermissions<DB, TB extends keyof DB & TableName>(
    db: Kysely<DB>,
    grantedTo: UserID | null,
    resourceID: ResourceID
  ) {
    await db
      .deleteFrom(this.tableName as unknown as TB)
      .where(db.dynamic.ref("grantedTo"), "=", grantedTo)
      .where(db.dynamic.ref("resourceID"), "=", resourceID)
      .execute();
  }

  /**
   * Sets the permissions of a user to the given resource.
   * @param db Database connection.
   * @param userID Key of user to grant access to.
   * @param resourceID Key of resource to grant access to.
   * @param permissions Access level to assign.
   */
  async setPermissions<DB, TB extends keyof DB & TableName>(
    db: Kysely<DB>,
    grantedTo: UserID | null,
    resourceID: ResourceID,
    permissions: Permissions,
    grantedBy: UserID | null
  ) {
    if (grantedTo === null && permissions > this.maxPublicPermissions) {
      throw Error(
        `Public user cannot be granted permissions > ${this.maxPublicPermissions}`
      );
    }
    if (grantedBy !== null && permissions > this.maxUserGrantedPermissions) {
      throw Error(
        `User cannot grant permissions > ${this.maxUserGrantedPermissions}`
      );
    }
    switch (this.databaseSyntax) {
      case "postgres":
        await db
          .insertInto(this.tableName as unknown as TB)
          .values({
            grantedTo,
            resourceID,
            permissions,
            grantedBy,
          } as any)
          .onConflict(
            (oc) =>
              oc
                .constraint(`${this.tableName}_key`)
                .doUpdateSet({ permissions, grantedBy } as any) as any
          )
          .execute();
        return;
      case "mysql":
      case "sqlite":
        await db
          .replaceInto(this.tableName as unknown as TB)
          .values({
            grantedTo,
            resourceID,
            permissions,
            grantedBy,
          } as any)
          .execute();
        return;
      default:
        throw Error(`Unsupported database syntax: ${this.databaseSyntax}`);
    }
  }

  private _toSafePermissions(
    grantedTo: UserID | null,
    permissions: Permissions,
    grantedBy: UserID | null
  ): Permissions {
    if (grantedTo === null) {
      return permissions > this.maxPublicPermissions
        ? this.maxPublicPermissions
        : permissions;
    }
    if (grantedBy !== null) {
      return permissions > this.maxUserGrantedPermissions
        ? this.maxUserGrantedPermissions
        : permissions;
    }
    return permissions;
  }
}
