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
  Permissions extends number | string = number,
  UserID extends PrimitiveKeyType<UserIDDataType> = PrimitiveKeyType<UserIDDataType>,
  ResourceID extends PrimitiveKeyType<ResourceIDDataType> = PrimitiveKeyType<ResourceIDDataType>
> {
  /** Syntax of the database SQL dialect. */
  databaseSyntax: "mysql" | "postgres" | "sqlite";

  /** Owner's permissions, used for returning permissions of owner. */
  ownerPermissions: Permissions;

  /** Name of the users table. */
  // TODO: rename sans Name suffix
  userTable: UserTable;
  /** Name of the key column of the users table. */
  userIDColumn: string;
  /** Data type of the key column of the users table. */
  userIDDataType: UserIDDataType;

  /** Name of the permissions-governed resources table. */
  resourceTable: ResourceTable;
  /** Name of the key column of the resources table. */
  resourceIDColumn: string;
  /** Data type of the key column of the resources table. */
  resourceIDDataType: ResourceIDDataType;
  /** Name of the owner key column of the resources table. */
  resourceOwnerKeyColumn: string;

  /** Sample user key used for inferring a nominal user key type. */
  sampleUserID?: UserID;
  /** Sample resource key used for inferring a nominal resource key type. */
  sampleResourceID?: ResourceID;
}
