import { CompilingStandardValidator } from "typebox-validators";

import { Base64UuidSchema } from "@fieldzoo/base64-uuid";

/**
 * Representation of a user ID, a base-64 encoded UUID.
 */

export type UserID = string & { readonly __validated__: unique symbol };

export class UserIDImpl {
  static schema = Base64UuidSchema;

  static castFrom(id: string) {
    this.#validator.assert(id, "Invalid user ID");
    return id as UserID;
  }

  static #validator = new CompilingStandardValidator(this.schema);
}
