import { Type } from "@sinclair/typebox";
import { CompilingStandardValidator } from "typebox-validators/standard";

import type { UnvalidatedFields } from "@fieldzoo/generic-types";
import {
  type UserHandle,
  toUserHandle,
  type UserName,
  toUserName,
} from "@fieldzoo/system-model";
import { type Password, toPassword } from "@fieldzoo/general-model";

/**
 * Data transfer object for sign up.
 */
export interface SignUpInfo {
  readonly name: UserName;
  readonly handle: UserHandle;
  readonly password: Password;
}

const schema = Type.Object({
  name: toUserName.schema,
  handle: toUserHandle.schema,
  password: toPassword.schema,
});
const validator = new CompilingStandardValidator(schema);

export function toSignUpInfo(fields: Readonly<UnvalidatedFields<SignUpInfo>>) {
  validator.assert(fields, "Invalid sign up fields");
  return fields as SignUpInfo;
}
toSignUpInfo.schema = schema;
