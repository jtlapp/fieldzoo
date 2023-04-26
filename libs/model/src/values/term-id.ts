import { MultitierValidator } from "@fieldzoo/multitier-validator";
import { NonEmptyString } from "@fieldzoo/typebox-types";

/**
 * Representation of a term ID
 */

export type TermID = string & { readonly __validated__: unique symbol };

export class TermIDImpl {
  static schema = NonEmptyString();

  static create(id: string) {
    this.#validator.validate(id, "Invalid term ID");
    return id as TermID;
  }

  static #validator = new MultitierValidator(this.schema);
}
