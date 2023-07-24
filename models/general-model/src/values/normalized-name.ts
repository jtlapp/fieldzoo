import { FormatRegistry, Type } from "@sinclair/typebox";

import { DisplayName, toDisplayName } from "./display-name.js";

/**
 * Normalized representation of a display name, suitable for looking up a name
 * despite variations in letter case and space/hyphen usage. The resulting
 * normalization may not be displayable for lacking correct display format.
 */

export type NormalizedName = string & { readonly __validated__: unique symbol };

FormatRegistry.Set("NORMALIZED_NAME", (v) => /^[^\p{Z}\p{C}]+$/u.test(v));

const schema = Type.String({
  format: "NORMALIZED_NAME",
  minLength: toDisplayName.schema.minLength,
  maxLength: toDisplayName.schema.maxLength,
});

export function toNormalizedName(displayName: DisplayName) {
  // displayName is necessarily valid
  return displayName.toLowerCase().replace(" ", "-") as NormalizedName;
}
toNormalizedName.schema = schema;
