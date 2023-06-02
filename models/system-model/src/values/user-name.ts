import { CompilingStandardValidator } from "typebox-validators";

import { UserNameUnicodeString } from "@fieldzoo/typebox-types";
import { validate } from "@fieldzoo/modeling";

/**
 * Account name of a user who can login
 */

export type UserName = string & { readonly __validated__: unique symbol };

export class UserNameImpl {
  static schema = UserNameUnicodeString({
    minLength: 2,
    maxLength: 50,
  });

  static castFrom(name: string, safely = true) {
    validate(this.#validator, name, "Invalid user name", safely);
    return name as UserName;
  }

  static #validator = new CompilingStandardValidator(this.schema);
}
