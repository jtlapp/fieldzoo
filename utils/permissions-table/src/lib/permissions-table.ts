import { Kysely, SelectQueryBuilder, sql } from "kysely";

import {
  KeyDataType,
  PrimitiveKeyType,
  PermissionsTableConfig,
} from "./permissions-table-config";
import { PermissionsResult } from "./permissions-result";
import { PermissionsRow } from "./permissions-row";

type Database<
  TableName extends string,
  UserID extends number | string,
  ResourceID extends number | string,
  Permissions extends number
> = { [K in TableName]: PermissionsRow<UserID, ResourceID, Permissions> };

/**
 * Class managing user permissions to database resources. Each resource is a row
 * of a particular resource table, and the class manages a table that is
 * dedicated to storing permissions for this single resource table. Permissions
 * are integers, so they can be used for access levels or flags. Deleting a user
 * or resource automatically deletes the associated permissions. The `null` user
 * ID represents public users and can be assigned permissions, providing the
 * minimum permissions for all users.
 *
 * The implementation ensures that you cannot accidentally grant the public user
 * more than a specified permissions level or have a user grant more permissions
 * than users are allowed to grant. Attempts to set permissions above these
 * limits throws an error, and if the database somehow ends up with permissions
 * in excess of these limits, the permissions reported automatically reduce to
 * the maximums that the configuration allows.
 *
 * An application that wishes to give the public identical access (or no access)
 * to all resources of a table can set `maxPublicPermissions` to 0 to disable
 * per-resource control of public access. In this case, the application
 * determines public permissions by means other than this class.
 *
 * An application calls `getPermissions()` to determine a user's permissions,
 * which will be the greater of the permissions explicitly granted to the user
 * (if any) and the permissions granted to the public (if any). For resources
 * with owners having owner permissions, either the application tests for owner
 * permissions separately from this class, or the application stores owner
 * permissions in the class's permissions table. In the latter case, be sure to
 * set `maxUserGrantedPermissions` to less than the owner permissions.
 *
 * The type parameters allow you to specify the types of user and resource IDs,
 * which can even be nominal types, though they must extend either strings or
 * numbers. You can also configure the permission table's name.
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
  readonly tableName: TableName;
  readonly maxPublicPermissions!: Permissions;
  readonly maxUserGrantedPermissions!: Permissions;
  readonly userTable!: UserTable;
  readonly userIDColumn!: string;
  readonly userIDDataType!: UserIDDataType;
  readonly resourceTable!: ResourceTable;
  readonly resourceIDColumn!: string;
  readonly resourceIDDataType!: ResourceIDDataType;

  constructor(
    config: PermissionsTableConfig<
      UserTable,
      UserIDDataType,
      ResourceTable,
      ResourceIDDataType,
      Permissions,
      UserID,
      ResourceID,
      TableName
    >
  ) {
    if (config.maxPublicPermissions > config.maxUserGrantedPermissions) {
      // This check allows us to save some clock cycles in _makePermissionsSafe()
      throw Error(
        "maxPublicPermissions cannot be greater than maxUserGrantedPermissions"
      );
    }
    Object.assign(this, config); // copy in case supplied config is changed
    this.tableName ??= `${config.resourceTable}_permissions` as TableName;
  }

  /**
   * Creates a permissions table for the configured resource. Permissions table
   * rows are deleted when the associated user or resource is deleted
   * (cascading on delete).
   * @param db Database connection.
   */
  async create(db: Kysely<any>) {
    const foreignUserIDColumn = `${this.userTable}.${this.userIDColumn}`;
    await db.schema
      .createTable(this.tableName)
      .addColumn("grantedTo", this.userIDDataType, (col) => {
        col = col.references(foreignUserIDColumn).onDelete("cascade");
        return this.maxPublicPermissions === 0 ? col.notNull() : col;
      })
      .addColumn("resourceID", this.resourceIDDataType, (col) =>
        col
          .notNull()
          .references(`${this.resourceTable}.${this.resourceIDColumn}`)
          .onDelete("cascade")
      )
      .addColumn("permissions", "integer", (col) => col.notNull())
      .addColumn("grantedAt", "timestamp", (col) =>
        col.notNull().defaultTo(sql`now()`)
      )
      .addColumn("grantedBy", this.userIDDataType, (col) =>
        col.references(foreignUserIDColumn)
      )
      .execute();

    await sql`create unique index "${sql.raw(this.tableName)}_key" 
      on "${sql.raw(this.tableName)}" ("grantedTo", "resourceID") 
      nulls not distinct;`.execute(db);
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
   * user has no permissions. If the user was assigned fewer permissions than
   * are available to the public, the public permissions are returned. The
   * returned permissions are limited by the configured `maxPublicPermissions`
   * and `maxUserGrantedPermissions`.
   * @param db Database connection.
   * @param grantedTo ID of the user; null for public users.
   * @param resourceID Key of resource to get permissions for.
   * @returns The permissions the user has to the resource.
   */
  async getPermissions<
    DB extends Database<TableName, UserID, ResourceID, Permissions>
  >(
    db: Kysely<DB>,
    grantedTo: UserID | null,
    resourceID: ResourceID
  ): Promise<Permissions>;

  /**
   * Returns the permissions a user has to a list of resources, returning one
   * entry for each resource, including resources with 0 permissions. If the
   * user was assigned fewer permissions than are available to the public, the
   * public permissions are returned. The returned permissions are limited by
   * the configured `maxPublicPermissions` and `maxUserGrantedPermissions`.
   * @param db Database connection.
   * @param grantedTo ID of the user; null for public users.
   * @param resourceID Keys of resources to get permissions for.
   * @returns The permissions the user has to the resources.
   */
  async getPermissions<
    DB extends Database<TableName, UserID, ResourceID, Permissions>
  >(
    db: Kysely<DB>,
    grantedTo: UserID | null,
    resourceIDs: ResourceID[]
  ): Promise<PermissionsResult<UserID, ResourceID, Permissions>[]>;

  async getPermissions<
    DB extends Database<TableName, UserID, ResourceID, Permissions>
  >(
    db: Kysely<DB>,
    grantedTo: UserID | null,
    resourceIDOrKeys: ResourceID | ResourceID[]
  ): Promise<
    Permissions | PermissionsResult<UserID, ResourceID, Permissions>[]
  > {
    if (Array.isArray(resourceIDOrKeys)) {
      const sortedResourceIDs = resourceIDOrKeys.slice().sort();
      const results = await this._getPermissionsQuery(db, grantedTo)
        .where("resourceID", "in", sortedResourceIDs as any[])
        .orderBy("resourceID")
        .execute();

      const permissions = new Array<
        PermissionsResult<UserID, ResourceID, Permissions>
      >(resourceIDOrKeys.length);
      let resultsIndex = 0;
      for (let i = 0; i < sortedResourceIDs.length; ++i) {
        const sourceResourceID = sortedResourceIDs[i];
        const result = results[resultsIndex];
        if (result !== undefined && result.resourceID === sourceResourceID) {
          [permissions[i], resultsIndex] = this._toGreaterResult(
            grantedTo,
            results,
            resultsIndex
          );
        } else {
          permissions[i] = {
            resourceID: sourceResourceID,
            permissions: 0 as Permissions,
            grantedBy: null,
          };
        }
      }
      return permissions;
    } else {
      const query = this._getPermissionsQuery(db, grantedTo).where(
        "resourceID",
        "=",
        resourceIDOrKeys as any
      );
      const results = await query.execute();
      if (results.length === 0) {
        return 0 as Permissions;
      }
      const [result, _] = this._toGreaterResult(grantedTo, results, 0);
      this._makePermissionsSafe(grantedTo, result);
      return result.permissions;
    }
  }

  /**
   * Removes a permissions grant for a user.
   * @param db Database connection.
   * @param grantedTo ID of the user; null for public users.
   * @param resourceID Key of resource to remove grant for.
   */
  async removePermissions<
    DB extends Database<TableName, UserID, ResourceID, Permissions>
  >(db: Kysely<DB>, grantedTo: UserID | null, resourceID: ResourceID) {
    if (grantedTo === null) {
      await db
        .deleteFrom(this.tableName)
        .where("grantedTo", "is", null)
        .where("resourceID", "=", resourceID as any)
        .execute();
    } else {
      await db
        .deleteFrom(this.tableName)
        .where("grantedTo", "=", grantedTo as any)
        .where("resourceID", "=", resourceID as any)
        .execute();
    }
  }

  /**
   * Sets the permissions of a user to the given resource. If the permissions
   * granted are less than those available to the public for the resource, the
   * grant will be recorded as requested, but queries for the user's
   * permissions will return the public permissions. However, in this case,
   * later reducing the public permissions will reduce the user's permissions.
   * @param db Database connection.
   * @param grantedTo ID of the user; null for public users.
   * @param resourceID Key of resource to grant access to.
   * @param permissions Access level to assign.
   */
  async setPermissions<
    DB extends Database<TableName, UserID, ResourceID, Permissions>
  >(
    db: Kysely<DB>,
    grantedTo: UserID | null,
    resourceID: ResourceID,
    permissions: Permissions,
    grantedBy: UserID | null
  ) {
    if (grantedTo === null && permissions > this.maxPublicPermissions) {
      throw Error(
        `Public users cannot be granted permissions > ${this.maxPublicPermissions}`
      );
    }
    if (grantedBy !== null && permissions > this.maxUserGrantedPermissions) {
      throw Error(
        `Users cannot grant permissions > ${this.maxUserGrantedPermissions}`
      );
    }
    await db
      .insertInto(this.tableName)
      .values({
        grantedTo,
        resourceID,
        permissions,
        grantedBy,
      } as any)
      .onConflict(
        (oc) =>
          oc
            .columns(["grantedTo", "resourceID"])
            .doUpdateSet({ permissions, grantedBy } as any) as any
      )
      .execute();
  }

  /**
   * Returns a query that returns the permissions a user has to a resource,
   * returning 0 if the user has no permissions, and returning the configured
   * owner permissions if the user is the owner of the resource.
   * @param db Database connection.
   * @param grantedTo ID of the user; null for public users.
   * @param resourceSelector Function that returns a query selecting the
   *  resource or resources to get permissions for. Its first argument is a
   *  query that selects from the resources table, and its second argument is
   *  the name of the resource key column to use for selecting resources.
   * @returns A query that returns the permissions the user has to the
   *  resource.
   */
  private _getPermissionsQuery<
    DB extends Database<TableName, UserID, ResourceID, Permissions>
  >(db: Kysely<DB>, grantedTo: UserID | null) {
    return db
      .selectFrom(this.tableName)
      .select(["resourceID", "permissions", "grantedBy"])
      .where(({ or, cmpr }) =>
        or([
          cmpr("grantedTo", "is", null),
          cmpr("grantedTo", "=", grantedTo as any),
        ])
      ) as SelectQueryBuilder<
      DB,
      TableName,
      PermissionsResult<UserID, ResourceID, Permissions>
    >;
  }

  /**
   * Returns the permissions result with the greatest permissions of two
   * sequential results for the same user and same resource. If there are
   * sequential results, one is for the user and the other is for public.
   * @param grantedTo ID of the user; null for public users.
   * @param results Permissions results containing results to compare.
   * @param resultsIndex Index of the first result to compare; the second
   *  result compared is at the next index, if present.
   * @returns The permissions result with the greatest permissions.
   */
  private _toGreaterResult(
    grantedTo: UserID | null,
    results: PermissionsResult<UserID, ResourceID, Permissions>[],
    resultsIndex: number
  ): [PermissionsResult<UserID, ResourceID, Permissions>, number] {
    const firstResult = results[resultsIndex];
    this._makePermissionsSafe(grantedTo, firstResult);
    if (++resultsIndex < results.length) {
      const nextResult = results[resultsIndex];
      if (nextResult.resourceID === firstResult.resourceID) {
        ++resultsIndex;
        this._makePermissionsSafe(grantedTo, nextResult);
        if (nextResult.permissions > firstResult.permissions) {
          return [nextResult, resultsIndex];
        }
      }
    }
    return [firstResult, resultsIndex];
  }

  /**
   * Limit returned permissions to `maxPublicPermissions` for the public and
   * `maxUserGrantedPermissions` for non-system users.
   * @param grantedTo ID of the user; null for public users.
   * @param result Permissions result in which to reduce permissions.
   */
  private _makePermissionsSafe(
    grantedTo: UserID | null,
    result: PermissionsResult<UserID, ResourceID, Permissions>
  ): void {
    if (grantedTo === null) {
      result.permissions =
        result.permissions > this.maxPublicPermissions
          ? this.maxPublicPermissions
          : result.permissions;
    } else if (result.grantedBy !== null) {
      result.permissions =
        result.permissions > this.maxUserGrantedPermissions
          ? this.maxUserGrantedPermissions
          : result.permissions;
    }
  }
}
