import { MultitierValidator } from "@fieldzoo/multitier-validator";
import { HexString } from "@fieldzoo/typebox-types";

export const PASSWORD_HASH_LENGTH = 64;

/**
 * Password hash hex string.
 */

export type PasswordHash = string & { readonly __validated__: unique symbol };

export class PasswordHashImpl {
  static schema = HexString({
    minLength: PASSWORD_HASH_LENGTH,
    maxLength: PASSWORD_HASH_LENGTH,
  });

  static castFrom(name: string, safely = true) {
    this.#validator.validate(name, "Invalid password hash", safely);
    return name as PasswordHash;
  }

  static #validator = new MultitierValidator(this.schema);
}
