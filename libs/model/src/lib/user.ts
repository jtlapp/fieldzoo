import { FieldsOf } from '@fieldzoo/utilities';

export class User {
  readonly name: string;
  readonly email: string;

  constructor(fields: FieldsOf<User>) {
    this.name = fields.name;
    this.email = fields.email;
  }
}
