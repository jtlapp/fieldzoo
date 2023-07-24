import { CompilingStandardValidator } from "typebox-validators/standard/index.js";

import { HexString } from "@fieldzoo/typebox-types";

import { validate } from "../utils/modeling-utils.js";

export const PASSWORD_HASH_LENGTH = 64;

/**
 * Password hash hex string.
 */

export type PasswordHash = string & { readonly __validated__: unique symbol };

const schema = HexString({
  minLength: PASSWORD_HASH_LENGTH,
  maxLength: PASSWORD_HASH_LENGTH,
});
const validator = new CompilingStandardValidator(schema);

export function toPasswordHash(name: string, safely = true) {
  validate(validator, name, "Invalid password hash", safely);
  return name as PasswordHash;
}
toPasswordHash.schema = schema;
