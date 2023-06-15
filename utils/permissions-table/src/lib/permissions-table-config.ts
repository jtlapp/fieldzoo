/**
 * Postgres data type for the user and resource key columns.
 */
export type KeyDataType = "integer" | "serial" | "text" | "uuid";

/**
 * JavaScript type associated with Postgres data types.
 */
export type KeyType<T extends KeyDataType> = T extends "integer" | "serial"
  ? number
  : string;

/**
 * Configuration for a permissions table.
 */
export interface PermissionsTableConfig<
  UserTable extends string,
  UserKeyDT extends KeyDataType,
  ResourceTable extends string,
  ResourceKeyDT extends KeyDataType,
  Permissions extends number = number,
  UserKey extends KeyType<UserKeyDT> = KeyType<UserKeyDT>,
  ResourceKey extends KeyType<ResourceKeyDT> = KeyType<ResourceKeyDT>
> {
  /** Syntax of the database SQL dialect. */
  databaseSyntax: "mysql" | "postgres" | "sqlite";

  /** Owner's permissions, used for returning permissions of owner. */
  ownerPermissions: Permissions;

  /** Name of the users table. */
  // TODO: rename sans Name suffix
  userTableName: UserTable;
  /** Name of the key column of the users table. */
  userKeyColumn: string;
  /** Data type of the key column of the users table. */
  userKeyDataType: UserKeyDT;

  /** Name of the permissions-governed resources table. */
  resourceTableName: ResourceTable;
  /** Name of the key column of the resources table. */
  resourceKeyColumn: string;
  /** Data type of the key column of the resources table. */
  resourceKeyDataType: ResourceKeyDT;
  /** Name of the owner key column of the resources table. */
  resourceOwnerKeyColumn: string;

  /** Sample user key used for inferring a nominal user key type. */
  sampleUserKey?: UserKey;
  /** Sample resource key used for inferring a nominal resource key type. */
  sampleResourceKey?: ResourceKey;
}
