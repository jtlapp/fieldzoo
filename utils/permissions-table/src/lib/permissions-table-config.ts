/**
 * Postgres data type for the user and resource key columns.
 */
export type KeyDataType = "integer" | "serial" | "text" | "uuid";

// TODO: Might be more intelligable referring to "ID" rather than "Key"

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
  ResourceTableName extends string,
  UserKeyDT extends KeyDataType,
  ResourceKeyDT extends KeyDataType,
  Permissions extends number = number,
  UserKey extends KeyType<UserKeyDT> = KeyType<UserKeyDT>,
  ResourceKey extends KeyType<ResourceKeyDT> = KeyType<ResourceKeyDT>
> {
  /** Owner's permissions, used for returning permissions of owner. */
  ownerPermissions: Permissions;

  /** Name of the users table. */
  userTableName: string;
  /** Name of the key column of the users table. */
  userKeyColumn: string;
  /** Data type of the key column of the users table. */
  userKeyDataType: UserKeyDT;

  /** Name of the permissions-governed resources table. */
  resourceTableName: ResourceTableName;
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
