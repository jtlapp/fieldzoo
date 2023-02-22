import { Type } from "@sinclair/typebox";

import { ShapeChecker } from "@fieldzoo/shapechecker";
import { FieldsOf } from "@fieldzoo/utilities";
import {
  NonEmptyString,
  EmailString,
  UserNameUniString,
} from "@fieldzoo/typebox-types";
import { freezeField } from "@fieldzoo/freeze-field";

/** Database ID of a user record */
export type UserID = string & { readonly __typeID: unique symbol };

/**
 * Class representing a user entity
 */
export class User {
  readonly id: UserID;
  name: string;
  email: string;

  static schema = Type.Object({
    id: NonEmptyString(),
    name: UserNameUniString({
      minLength: 2,
      maxLength: 50,
    }),
    email: EmailString({ maxLength: 100 }),
  });
  static #checker = new ShapeChecker(this.schema);

  constructor(fields: FieldsOf<User>, assumeValid = false) {
    this.id = fields.id;
    this.name = fields.name;
    this.email = fields.email;

    if (!assumeValid) {
      User.#checker.safeValidate(this, "Invalid user");
    }
    freezeField(this, "id");
  }
}
export interface User {
  readonly __typeID: unique symbol;
}
