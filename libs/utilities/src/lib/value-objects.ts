/**
 * Generically useful DDD value objects.
 */

import { IsEmail } from "class-validator";

import { assertValid } from "./validation";

/**
 * Email address value object
 */
export class EmailAddress {
  @IsEmail()
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
