import { MultitierValidator } from "@fieldzoo/multitier-validator";
import { NonEmptyString } from "@fieldzoo/typebox-types";
import { BASE64_UUID_LENGTH } from "../lib/constants";

/**
 * Representation of a term ID
 */

export type TermID = string & { readonly __validated__: unique symbol };

export class TermIDImpl {
  static schema = NonEmptyString({
    minLength: BASE64_UUID_LENGTH,
    maxLength: BASE64_UUID_LENGTH,
  });

  static create(id: string) {
    this.#validator.validate(id, "Invalid term ID");
    return id as TermID;
  }

  static #validator = new MultitierValidator(this.schema);
}
