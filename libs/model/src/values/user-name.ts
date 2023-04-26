import { MultitierValidator } from "@fieldzoo/multitier-validator";
import { UserNameUnicodeString } from "@fieldzoo/typebox-types";

/**
 * Account name of a user who can login
 */

export type UserName = string & { readonly __validated__: unique symbol };

export class UserNameImpl {
  static schema = UserNameUnicodeString({
    minLength: 2,
    maxLength: 50,
  });

  static create(name: string, safely = true) {
    this.#validator.validate(name, "Invalid user name", safely);
    return name as UserName;
  }

  static #validator = new MultitierValidator(this.schema);
}
