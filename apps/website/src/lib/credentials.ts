import { Type } from "@sinclair/typebox";
import { CompilingStandardValidator } from "typebox-validators/standard";

import type { UnvalidatedFields } from "@fieldzoo/generic-types";
import { type EmailAddress, toEmailAddress } from "@fieldzoo/general-model";
import { type Password, toPassword } from "@fieldzoo/general-model";

/**
 * Credentials for sign up or login.
 */
export interface Credentials {
  readonly email: EmailAddress;
  readonly password: Password;
}

const schema = Type.Object({
  email: toEmailAddress.schema,
  password: toPassword.schema,
});
const validator = new CompilingStandardValidator(schema);

export function toCredentials(
  fields: Readonly<UnvalidatedFields<Credentials>>
) {
  validator.assert(fields, "Invalid credentials");
  return fields as Credentials;
}
toCredentials.schema = schema;
