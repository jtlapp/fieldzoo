import { CompilingStandardValidator } from "typebox-validators";

import { Base64UuidSchema } from "@fieldzoo/base64-uuid";

/**
 * Representation of a glossary ID
 */

export type GlossaryID = string & { readonly __validated__: unique symbol };

export class GlossaryIDImpl {
  static schema = Base64UuidSchema;

  static castFrom(id: string) {
    this.#validator.assert(id, "Invalid glossary ID");
    return id as GlossaryID;
  }

  static #validator = new CompilingStandardValidator(this.schema);
}
