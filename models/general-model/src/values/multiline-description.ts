import { CompilingStandardValidator } from "typebox-validators";

import { MultiLineUnicodeString } from "@fieldzoo/typebox-types";
import { validate } from "../utils/modeling-utils";

/**
 * Multiline unicode description
 */

export type MultilineDescription = string & {
  readonly __validated__: unique symbol;
};

export class MultilineDescriptionImpl {
  static schema = MultiLineUnicodeString({ minLength: 1, maxLength: 1000 });

  static castFrom(description: string, safely = true) {
    validate(this.#validator, description, "Invalid description", safely);
    return description as MultilineDescription;
  }

  static #validator = new CompilingStandardValidator(this.schema);
}
