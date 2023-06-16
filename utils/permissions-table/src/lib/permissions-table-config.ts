/**
 * Postgres data type for the user and resource key columns.
 */
export type KeyDataType = "integer" | "text" | "uuid";

/**
 * JavaScript type associated with Postgres data types.
 */
export type PrimitiveKeyType<T extends KeyDataType> = T extends "integer"
  ? number
  : string;

/**
 * Configuration for a permissions table.
 */
export interface PermissionsTableConfig<
  UserTable extends string,
  UserIDDataType extends KeyDataType,
  ResourceTable extends string,
  ResourceIDDataType extends KeyDataType,
  Permissions extends number = number,
  UserID extends PrimitiveKeyType<UserIDDataType> = PrimitiveKeyType<UserIDDataType>,
  ResourceID extends PrimitiveKeyType<ResourceIDDataType> = PrimitiveKeyType<ResourceIDDataType>,
  TableName extends string = `${ResourceTable}_permissions`
> {
  /** Name of the permissions table */
  tableName?: TableName;

  /**
   * Maximum valid permissions for the public user (having a `null` user ID).
   * 0 disallows public access. Used to prevent accidentally granting the
   * public excessive permissions. Also used to infer the permissions type.
   */
  maxPublicPermissions: Permissions;
  /**
   * Maximum permissions that a user can grant to another user. The system
   * user (with `null` user ID) can grant greater permissions. Used to prevent
   * accidentally granting excessive permissions.
   */
  maxUserGrantedPermissions: Permissions;

  /** Name of the users table */
  userTable: UserTable;
  /** Name of the key column of the users table */
  userIDColumn: string;
  /** Data type of the key column of the users table */
  userIDDataType: UserIDDataType;

  /** Name of the permissions-governed resources table */
  resourceTable: ResourceTable;
  /** Name of the key column of the resources table */
  resourceIDColumn: string;
  /** Data type of the key column of the resources table */
  resourceIDDataType: ResourceIDDataType;

  /** Sample user key used for inferring a nominal user key type */
  sampleUserID?: UserID;
  /** Sample resource key used for inferring a nominal resource key type */
  sampleResourceID?: ResourceID;
}
