import { CompilingStandardValidator } from "typebox-validators";

import { UserHandleString } from "@fieldzoo/typebox-types";
import { validate } from "@fieldzoo/general-model";

/**
 * User's unique handle
 */

export type UserHandle = string & { readonly __validated__: unique symbol };

const schema = UserHandleString({
  minLength: 2,
  maxLength: 32,
});
const validator = new CompilingStandardValidator(schema);

export function toUserHandle(handle: string, safely = true) {
  validate(validator, handle, "Invalid user handle", safely);
  return handle as UserHandle;
}
toUserHandle.schema = schema;
