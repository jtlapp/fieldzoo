/**
 * Postgres data type for the user and resource key columns.
 */
export type KeyDataType = "integer" | "text" | "uuid";

/**
 * Configuration for an access level table.
 */
export interface AccessLevelTableConfig<
  ResourceTableName extends string,
  UserKeyDT extends KeyDataType,
  ResourceKeyDT extends KeyDataType
> {
  userTableName: string;
  userKeyColumn: string;
  userKeyDataType: UserKeyDT;
  resourceTableName: ResourceTableName;
  resourceKeyColumn: string;
  resourceKeyDataType: ResourceKeyDT;
  ownerKeyColumn: string;
}
