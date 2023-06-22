import { CompilingStandardValidator } from "typebox-validators/standard";

import { HexString } from "@fieldzoo/typebox-types";

import { validate } from "../utils/modeling-utils";

export const PASSWORD_SALT_LENGTH = 16;

/**
 * Password salt hex string.
 */

export type PasswordSalt = string & { readonly __validated__: unique symbol };

export class PasswordSaltImpl {
  static schema = HexString({
    minLength: PASSWORD_SALT_LENGTH,
    maxLength: PASSWORD_SALT_LENGTH,
  });

  static castFrom(name: string, safely = true) {
    validate(this.#validator, name, "Invalid password salt", safely);
    return name as PasswordSalt;
  }

  static #validator = new CompilingStandardValidator(this.schema);
}
