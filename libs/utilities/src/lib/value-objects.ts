import { IsEmail } from "class-validator";

import { assertValidSync } from "./validation";

export class EmailAddress {
  @IsEmail()
  readonly value: string;

  constructor(email: string) {
    this.value = email;
    assertValidSync(this, "Invalid email");
    Object.freeze(this);
  }
}
export interface EmailAddress {
  readonly __type: unique symbol;
}
