import { Type } from "@sinclair/typebox";
import { CompilingStandardValidator } from "typebox-validators/standard";

import type { UnvalidatedFields } from "@fieldzoo/generic-types";
import { type UserHandle, toUserHandle } from "@fieldzoo/system-model";
import { type Password, toPassword } from "@fieldzoo/general-model";

/**
 * Data transfer object for login.
 */
export interface LoginInfo {
  readonly userHandle: UserHandle;
  readonly password: Password;
}

const schema = Type.Object({
  userHandle: toUserHandle.schema,
  password: toPassword.schema,
});
const validator = new CompilingStandardValidator(schema);

export function toLoginInfo(fields: Readonly<UnvalidatedFields<LoginInfo>>) {
  validator.assert(fields, "Invalid login fields");
  return fields as LoginInfo;
}
toLoginInfo.schema = schema;
