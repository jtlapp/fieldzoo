import { Type } from "@sinclair/typebox";
import { CompilingStandardValidator } from "typebox-validators/standard/index.js";

import { validate } from "../utils/modeling-utils.js";

export const MIN_PASSWORD_LENGTH = 10;
export const MAX_PASSWORD_LENGTH = 100;

/**
 * Password hash hex string.
 */

export type Password = string & { readonly __validated__: unique symbol };

const schema = Type.String({
  minLength: MIN_PASSWORD_LENGTH,
  maxLength: MAX_PASSWORD_LENGTH,
  errorMessage: `must have ${MIN_PASSWORD_LENGTH} to ${MAX_PASSWORD_LENGTH} characters`,
});
const validator = new CompilingStandardValidator(schema);

export function toPassword(name: string) {
  validate(validator, name, "Invalid password hash");
  return name as Password;
}
toPassword.schema = schema;
