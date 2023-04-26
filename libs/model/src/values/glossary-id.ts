import { MultitierValidator } from "@fieldzoo/multitier-validator";
import { NonEmptyString } from "@fieldzoo/typebox-types";

/**
 * Representation of a glossary ID
 */

export type GlossaryID = string & { readonly __validated__: unique symbol };

export class GlossaryIDImpl {
  static schema = NonEmptyString();

  static create(id: string) {
    this.#validator.validate(id, "Invalid glossary ID");
    return id as GlossaryID;
  }

  static #validator = new MultitierValidator(this.schema);
}
