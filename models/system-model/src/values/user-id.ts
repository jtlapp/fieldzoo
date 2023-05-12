import { MultitierValidator } from "@fieldzoo/multitier-validator";
import { UuidString } from "@fieldzoo/typebox-types";

/**
 * Representation of a user ID, determined by Supabase (a UUID)
 */

export type UserID = string & { readonly __validated__: unique symbol };

export class UserIDImpl {
  static schema = UuidString();

  static castFrom(id: string) {
    this.#validator.validate(id, "Invalid user ID");
    return id as UserID;
  }

  static #validator = new MultitierValidator(this.schema);
}
