import { Matches, MaxLength, MinLength } from "class-validator";

import { assertValid, EmailAddress, FieldsOf } from "@fieldzoo/utilities";

/** Min. length of user name */
export const MIN_USER_NAME_LENGTH = 2;
/** Max. length of user name */
export const MAX_USER_NAME_LENGTH = 40;

const USER_NAME_REGEX = /^\p{L}+((\. |[-.' ])\p{L}+\.?)*$/u;

/** Database ID of a user record */
export type UserID = string & { readonly __typeID: unique symbol };

/**
 * Class representing a user
 */
export class User {
  readonly id: UserID;
  readonly name: UserName;
  readonly email: EmailAddress;

  constructor(fields: FieldsOf<User>) {
    this.id = fields.id;
    this.name = fields.name;
    this.email = fields.email;
  }
}
export interface User {
  readonly __typeID: unique symbol;
}

/**
 * Class representing a valid user name
 */
export class UserName {
  @Matches(USER_NAME_REGEX)
  @MinLength(MIN_USER_NAME_LENGTH)
  @MaxLength(MAX_USER_NAME_LENGTH) // checked first
  readonly value: string;

  constructor(userName: string) {
    this.value = userName;
    assertValid(this, "Invalid user name", false);
    Object.freeze(this);
  }
}
export interface UserName {
  readonly __typeID: unique symbol;
}
