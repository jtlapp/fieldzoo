import { CompilingStandardValidator } from "typebox-validators/standard";

import { HexString } from "@fieldzoo/typebox-types";

import { validate } from "../utils/modeling-utils";

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
    validate(this.#validator, name, "Invalid password hash", safely);
    return name as PasswordHash;
  }

  static #validator = new CompilingStandardValidator(this.schema);
}
