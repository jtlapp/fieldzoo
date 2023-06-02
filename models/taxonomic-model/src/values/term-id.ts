import { Type } from "@sinclair/typebox";

import { CompilingStandardValidator } from "typebox-validators";

/**
 * Representation of a term ID
 */

export type TermID = number & { readonly __validated__: unique symbol };

export class TermIDImpl {
  static schema = Type.Integer({ minimum: 1 });

  static castFrom(id: number) {
    this.#validator.assert(id, "Invalid term ID");
    return id as TermID;
  }

  static #validator = new CompilingStandardValidator(this.schema);
}
