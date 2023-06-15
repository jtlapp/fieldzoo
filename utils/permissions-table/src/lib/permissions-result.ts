/**
 * Object reporting permissions to a resource.
 */
export interface PermissionsResult<ResourceID, Permissions> {
  /** Key of the resource */
  resourceID: ResourceID;
  /** Permissions to the resource */
  permissions: Permissions;
}
