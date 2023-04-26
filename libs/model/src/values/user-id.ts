import { Type } from "@sinclair/typebox";

import { MultitierValidator } from "@fieldzoo/multitier-validator";

/**
 * Representation of a user ID
 */

export type UserID = number & { readonly __validated__: unique symbol };

export class UserIDImpl {
  static schema = Type.Integer({ minimum: 1 });

  static create(id: number) {
    this.#validator.validate(id, "Invalid user ID");
    return id as UserID;
  }

  static #validator = new MultitierValidator(this.schema);
}
