import { MultitierValidator } from "@fieldzoo/multitier-validator";
import { SingleLineUnicodeString } from "@fieldzoo/typebox-types";

/**
 * Displayable entity name, not necessarily normalized.
 */

export type DisplayName = string & { readonly __validated__: unique symbol };

export class DisplayNameImpl {
  static schema = SingleLineUnicodeString({
    minLength: 1,
    maxLength: 100,
  });

  static castFrom(name: string, safely = true) {
    this.#validator.validate(name, "Invalid display name", safely);
    return name as DisplayName;
  }

  static #validator = new MultitierValidator(this.schema);
}
