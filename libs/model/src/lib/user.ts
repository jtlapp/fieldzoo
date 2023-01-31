import { Matches, MaxLength, MinLength } from "class-validator";

import { FieldsOf } from "@fieldzoo/utilities";
import {
  ValidatingObject,
  EmailAddress,
  USER_NAME_REGEX,
} from "@fieldzoo/validation";

/** Min. length of user name (chars) */
export const MIN_USER_NAME_LENGTH = 2;
/** Max. length of user name (chars) */
export const MAX_USER_NAME_LENGTH = 40;

/** Database ID of a user record */
export type UserID = string & { readonly __typeID: unique symbol };

/**
 * Class representing a user entity
 */
export class User extends ValidatingObject {
  readonly id: UserID;
  name: UserName;
  email: EmailAddress;

  constructor(fields: FieldsOf<User>) {
    super();
    this.id = fields.id;
    this.name = fields.name;
    this.email = fields.email;
    this.freezeField("id");
  }
}
export interface User {
  readonly __typeID: unique symbol;
}

/**
 * Class representing a valid user name
 */
export class UserName extends ValidatingObject {
  @Matches(USER_NAME_REGEX)
  @MinLength(MIN_USER_NAME_LENGTH)
  @MaxLength(MAX_USER_NAME_LENGTH) // checked first
  readonly value: string;

  constructor(userName: string, assumeValid = false) {
    super();
    this.value = userName;
    if (!assumeValid) this.validate("user name", false);
    Object.freeze(this);
  }
}
export interface UserName {
  readonly __typeID: unique symbol;
}
