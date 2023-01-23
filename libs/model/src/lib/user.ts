import {} from "class-validator";

import { FieldsOf } from "@fieldzoo/utilities";

export class User {
  readonly id: string;
  readonly name: string;
  readonly email: string;

  constructor(fields: FieldsOf<User>) {
    this.id = fields.id;
    this.name = fields.name;
    this.email = fields.email;
  }
}
export interface User {
  readonly __type: unique symbol;
}
