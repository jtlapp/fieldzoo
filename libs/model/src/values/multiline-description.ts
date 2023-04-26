import { MultitierValidator } from "@fieldzoo/multitier-validator";
import { MultiLineUnicodeString } from "@fieldzoo/typebox-types";

/**
 * Multiline unicode description
 */

export type MultilineDescription = string & {
  readonly __validated__: unique symbol;
};

export class MultilineDescriptionImpl {
  static schema = MultiLineUnicodeString({ minLength: 1, maxLength: 1000 });

  static create(description: string, safely = true) {
    this.#validator.validate(description, "Invalid description", safely);
    return description as MultilineDescription;
  }

  static #validator = new MultitierValidator(this.schema);
}
