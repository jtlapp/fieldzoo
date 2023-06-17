/**
 * Interface for a row of a permissions table.
 */

export interface PermissionsRow<
  UserID extends number | string,
  ResourceID extends number | string,
  Permissions extends number
> {
  grantedTo: UserID;
  resourceID: ResourceID;
  permissions: Permissions;
  grantedAt: Date;
  grantedBy: UserID;
}
