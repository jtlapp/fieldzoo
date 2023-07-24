import { CompilingStandardValidator } from "typebox-validators/standard/index.js";

import { HexString } from "@fieldzoo/typebox-types";

import { validate } from "../utils/modeling-utils.js";

export const PASSWORD_SALT_LENGTH = 16;

/**
 * Password salt hex string.
 */

export type PasswordSalt = string & { readonly __validated__: unique symbol };

const schema = HexString({
  minLength: PASSWORD_SALT_LENGTH,
  maxLength: PASSWORD_SALT_LENGTH,
});
const validator = new CompilingStandardValidator(schema);

export function toPasswordSalt(name: string, safely = true) {
  validate(validator, name, "Invalid password salt", safely);
  return name as PasswordSalt;
}
toPasswordSalt.schema = schema;
