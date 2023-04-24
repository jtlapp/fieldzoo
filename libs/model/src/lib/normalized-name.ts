import { DisplayName } from "./display-name";

/**
 * Normalized representation of a display name, suitable for looking up a name
 * despite variations in letter case. The resulting normalization may not be
 * displayable for lacking correct letter case.
 */

export type NormalizedName = string & { readonly __typeID: unique symbol };

export function createNormalizedName(displayName: DisplayName): NormalizedName {
  return displayName.toLowerCase() as NormalizedName;
}
