import { Type } from "@sinclair/typebox";

import { MultitierValidator } from "@fieldzoo/multitier-validator";

/**
 * Representation of a term ID
 */

export type TermID = number & { readonly __validated__: unique symbol };

export class TermIDImpl {
  static schema = Type.Integer({ minimum: 1 });

  static castFrom(id: number) {
    this.#validator.validate(id, "Invalid term ID");
    return id as TermID;
  }

  static #validator = new MultitierValidator(this.schema);
}
