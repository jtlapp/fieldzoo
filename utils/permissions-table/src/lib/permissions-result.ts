/**
 * Object reporting the permissions a user has to a resource.
 */
export interface PermissionsResult<UserID, ResourceID, Permissions> {
  /** ID of the resource to which permissions were granted */
  resourceID: ResourceID;
  /** Permissions granted to the user for the resource */
  permissions: Permissions;
  /** ID of the user who granted the permissions; null is a system grant */
  grantedBy: UserID | null;
}
