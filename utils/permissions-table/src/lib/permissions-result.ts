/**
 * Object reporting permissions to a resource.
 */
export interface PermissionsResult<Permissions, ResourceKey> {
  /** Key of the resource */
  resourceKey: ResourceKey;
  /** Permissions to the resource */
  permissions: Permissions;
}
