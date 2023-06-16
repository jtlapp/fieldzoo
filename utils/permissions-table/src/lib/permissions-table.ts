import { Kysely, SelectQueryBuilder, sql } from "kysely";

import {
  DatabaseSyntax,
  KeyDataType,
  PrimitiveKeyType,
  PermissionsTableConfig,
} from "./permissions-table-config";
import { PermissionsResult } from "./permissions-result";

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
  private readonly internalResourceIDColumn: string;

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
    if (config.maxPublicPermissions > config.maxUserGrantedPermissions) {
      // This check allows us to save some clock cycles in _makePermissionsSafe()
      throw Error(
        "maxPublicPermissions cannot be greater than maxUserGrantedPermissions"
      );
    }
    Object.assign(this, config); // copy in case supplied config is changed
    this.tableName ??= `${config.resourceTable}_permissions` as TableName;
    this.foreignUserIDColumn = `${config.userTable}.${config.userIDColumn}`;
    this.foreignResourceIDColumn = `${config.resourceTable}.${config.resourceIDColumn}`;
    this.internalResourceIDColumn = `${this.tableName}.resourceID`;
  }

  /**
   * Returns a CreateTableBuilder for creating a permissions table for
   * the configured resource. Permissions table rows are deleted when the
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
   * user has no permissions. If the user was assigned fewer permissions than
   * are available to the public, the public permissions are returned. The
   * returned permissions are limited by the configured `maxPublicPermissions`
   * and `maxUserGrantedPermissions`.
   * @param db Database connection.
   * @param grantedTo ID of the user; null for public users.
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
   * entry for each resource, including resources with 0 permissions. If the
   * user was assigned fewer permissions than are available to the public, the
   * public permissions are returned. The returned permissions are limited by
   * the configured `maxPublicPermissions` and `maxUserGrantedPermissions`.
   * @param db Database connection.
   * @param grantedTo ID of the user; null for public users.
   * @param resourceID Keys of resources to get permissions for.
   * @returns The permissions the user has to the resources.
   */
  async getPermissions<DB>(
    db: Kysely<DB>,
    grantedTo: UserID | null,
    resourceIDs: ResourceID[]
  ): Promise<PermissionsResult<UserID, ResourceID, Permissions>[]>;

  async getPermissions<DB>(
    db: Kysely<DB>,
    grantedTo: UserID | null,
    resourceIDOrKeys: ResourceID | ResourceID[]
  ): Promise<
    Permissions | PermissionsResult<UserID, ResourceID, Permissions>[]
  > {
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
      const query = this.getPermissionsQuery(db, grantedTo).where(
        db.dynamic.ref(this.internalResourceIDColumn),
        "=",
        resourceIDOrKeys
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
  getPermissionsQuery<DB, TB extends keyof DB & TableName>(
    db: Kysely<DB>,
    grantedTo: UserID | null
  ) {
    return db
      .selectFrom(this.tableName as unknown as TB)
      .select([
        sql.ref(this.internalResourceIDColumn).as("resourceID"),
        sql.ref("permissions").as("permissions"),
        sql.ref("grantedBy").as("grantedBy"),
      ])
      .where(({ or, cmpr }) =>
        or([
          cmpr(db.dynamic.ref("grantedTo"), "is", null),
          cmpr(db.dynamic.ref("grantedTo"), "=", grantedTo),
        ])
      ) as SelectQueryBuilder<
      DB,
      TB,
      PermissionsResult<UserID, ResourceID, Permissions>
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
   * Removes a permissions grant for a user.
   * @param db Database connection.
   * @param grantedTo ID of the user; null for public users.
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
  async setPermissions<DB, TB extends keyof DB & TableName>(
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
