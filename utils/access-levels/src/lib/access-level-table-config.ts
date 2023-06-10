/**
 * Postgres data type for the user and resource key columns.
 */
export type KeyDataType = "integer" | "text" | "uuid";

/**
 * Configuration for an access level table.
 */
export interface AccessLevelTableConfig<
  UserKeyDT extends KeyDataType,
  ResourceKeyDT extends KeyDataType
> {
  userTableDotKeyColumn: string;
  userKeyDataType: UserKeyDT;
  resourceTableName: string;
  resourceKeyColumn: string;
  resourceKeyDataType: ResourceKeyDT;
  ownerKeyColumn: string;
}
