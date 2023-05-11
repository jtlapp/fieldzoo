import { MultitierValidator } from "@fieldzoo/multitier-validator";
import { UserHandleString } from "@fieldzoo/typebox-types";

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
    this.#validator.validate(handle, "Invalid user handle", safely);
    return handle as UserHandle;
  }

  static #validator = new MultitierValidator(this.schema);
}
