import { CompilingStandardValidator } from "typebox-validators";

import { UserHandleString } from "@fieldzoo/typebox-types";
import { validate } from "@fieldzoo/general-model";

/**
 * User's unique handle
 */

export const MIN_USER_HANDLE_LENGTH = 2;
export const MAX_USER_HANDLE_LENGTH = 32;

export type UserHandle = string & { readonly __validated__: unique symbol };

const schema = UserHandleString({
  minLength: MIN_USER_HANDLE_LENGTH,
  maxLength: MAX_USER_HANDLE_LENGTH,
  errorMessage: `must be letters and numbers optionally delimited by underscores, ${MIN_USER_HANDLE_LENGTH} to ${MAX_USER_HANDLE_LENGTH} characters long`,
});
const validator = new CompilingStandardValidator(schema);

export function toUserHandle(userHandle: string, safely = true) {
  validate(validator, userHandle, "Invalid user handle", safely);
  return userHandle as UserHandle;
}
toUserHandle.schema = schema;
