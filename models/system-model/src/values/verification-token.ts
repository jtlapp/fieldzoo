import { CompilingStandardValidator } from "typebox-validators";

import { Base64UuidSchema } from "@fieldzoo/base64-uuid";

/**
 * Representation of a verification token, a base-64 encoded UUID.
 */

// TODO: maybe rename this to VerificationCode
export type VerificationToken = string & {
  readonly __validated__: unique symbol;
};

const schema = Base64UuidSchema;
const validator = new CompilingStandardValidator(schema);

export function toVerificationToken(id: string) {
  validator.assert(id, "Invalid verification token");
  return id as VerificationToken;
}
toVerificationToken.schema = schema;
