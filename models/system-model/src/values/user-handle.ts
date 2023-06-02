import { CompilingStandardValidator } from "typebox-validators";

import { UserHandleString } from "@fieldzoo/typebox-types";
import { validate } from "@fieldzoo/modeling";

/**
 * User's unique handle
 */

export type UserHandle = string & { readonly __validated__: unique symbol };

export class UserHandleImpl {
  static schema = UserHandleString({
    minLength: 2,
    maxLength: 32,
  });

  static castFrom(handle: string, safely = true) {
    validate(this.#validator, handle, "Invalid user handle", safely);
    return handle as UserHandle;
  }

  static #validator = new CompilingStandardValidator(this.schema);
}
