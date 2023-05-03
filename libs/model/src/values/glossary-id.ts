import { Base64UuidSchema } from "../lib/typebox-schemas";
import { MultitierValidator } from "@fieldzoo/multitier-validator";

/**
 * Representation of a glossary ID
 */

export type GlossaryID = string & { readonly __validated__: unique symbol };

export class GlossaryIDImpl {
  static schema = Base64UuidSchema;

  static castFrom(id: string) {
    this.#validator.validate(id, "Invalid glossary ID");
    return id as GlossaryID;
  }

  static #validator = new MultitierValidator(this.schema);
}
