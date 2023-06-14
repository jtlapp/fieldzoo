/**
 * Object reporting permissions to a resource.
 */
export interface PermissionsResult<ResourceKey, Permissions> {
  /** Key of the resource */
  resourceKey: ResourceKey;
  /** Permissions to the resource */
  permissions: Permissions;
}
