import { Matches, MaxLength, MinLength } from "class-validator";

import { assertValid, EmailAddress, FieldsOf } from "@fieldzoo/utilities";

import { RecordID } from "./record-id";

/** Min. length of user name */
export const MIN_NAME_LENGTH = 2;
/** Max. length of user name */
export const MAX_NAME_LENGTH = 40;

const USER_NAME_REGEX = /^\p{L}+((\. |[-.' ])\p{L}+\.?)*$/u;

/**
 * Class representing a user
 */
export class User {
  readonly id: RecordID;
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
  @MinLength(MIN_NAME_LENGTH)
  @MaxLength(MAX_NAME_LENGTH) // checked first
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
