import * as typebox from "@sinclair/typebox";

import { DisplayName, DisplayNameImpl } from "./display-name";
import { TypeSystem } from "@sinclair/typebox/system";

/**
 * Normalized representation of a display name, suitable for looking up a name
 * despite variations in letter case and space/hyphen usage. The resulting
 * normalization may not be displayable for lacking correct display format.
 */

export type NormalizedName = string & { readonly __validated__: unique symbol };

TypeSystem.CreateFormat("NORMALIZED_NAME", (v) => /^[^\p{Z}\p{C}]+$/u.test(v));

export class NormalizedNameImpl {
  static schema = typebox.Type.String({
    format: "NORMALIZED_NAME",
    minLength: DisplayNameImpl.schema.minLength,
    maxLength: DisplayNameImpl.schema.maxLength,
  });

  static castFrom(displayName: DisplayName) {
    // displayName is necessarily valid
    return displayName.toLowerCase().replace(" ", "-") as NormalizedName;
  }
}
