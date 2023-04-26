import * as typebox from "@sinclair/typebox";
import { MultitierValidator } from "@fieldzoo/multitier-validator";

import { DisplayName } from "./display-name";

/**
 * Normalized representation of a display name, suitable for looking up a name
 * despite variations in letter case. The resulting normalization may not be
 * displayable for lacking correct letter case.
 */

export type NormalizedName = string & { readonly __validated__: unique symbol };

export class NormalizedNameImpl {
  // TODO: limit length
  static schema = typebox.Type.String();

  static create(displayName: DisplayName) {
    this.#validator.validate(displayName, "Invalid description");
    return displayName.toLowerCase() as NormalizedName;
  }

  static #validator = new MultitierValidator(this.schema);
}
