import * as typebox from "@sinclair/typebox";

import { DisplayName, DisplayNameImpl } from "./display-name";

/**
 * Normalized representation of a display name, suitable for looking up a name
 * despite variations in letter case and space/hyphen usage. The resulting
 * normalization may not be displayable for lacking correct display format.
 */

export type NormalizedName = string & { readonly __validated__: unique symbol };

export class NormalizedNameImpl {
  static schema = typebox.Type.String({
    minLength: DisplayNameImpl.schema.minLength,
    maxLength: DisplayNameImpl.schema.maxLength,
  });

  static create(displayName: DisplayName) {
    // displayName is necessarily valid
    return displayName.toLowerCase().replace(" ", "-") as NormalizedName;
  }
}
