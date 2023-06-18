import { CompilingStandardValidator } from "typebox-validators";

import { SingleLineUnicodeString } from "@fieldzoo/typebox-types";
import { validate } from "../utils/modeling-utils";

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
    validate(this.#validator, name, "Invalid display name", safely);
    return name as DisplayName;
  }

  static #validator = new CompilingStandardValidator(this.schema);
}
