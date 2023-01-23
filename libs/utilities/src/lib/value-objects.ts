/**
 * Generically useful DDD value objects.
 */

import { IsEmail, MaxLength } from "class-validator";

import { assertValid } from "./validation";

/** Maximum length of an email */
export const MAX_EMAIL_LENGTH = 100;

/**
 * Email address value object
 */
export class EmailAddress {
  @IsEmail()
  @MaxLength(MAX_EMAIL_LENGTH) // checked first
  readonly value: string;

  constructor(email: string) {
    this.value = email;
    assertValid(this, "Invalid email");
    Object.freeze(this);
  }
}
export interface EmailAddress {
  readonly __type: unique symbol;
}
