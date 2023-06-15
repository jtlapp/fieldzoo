/**
 * Interface for a row of a permissions table.
 */

export interface PermissionsRow<
  UserID extends number | string,
  ResourceID extends number | string,
  Permissions extends number | string
> {
  userID: UserID;
  resourceID: ResourceID;
  permissions: Permissions;
  assignedAt: Date;
  assignedBy: UserID;
}
