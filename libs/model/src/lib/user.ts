import { Type } from "@sinclair/typebox";

import { FieldsOf, SelectivePartial } from "@fieldzoo/generic-types";
import { OrmObject } from "@fieldzoo/kysely-facets";
import { SafeValidator } from "@fieldzoo/safe-validator";
import { EmailString, UserNameUniString } from "@fieldzoo/typebox-types";
import { freezeField } from "@fieldzoo/freeze-field";

/** Database ID of a user record */
export type UserID = number & { readonly __typeID: unique symbol };

/**
 * Class representing a valid user.
 */
export class User implements OrmObject<User, ["id"]> {
  readonly id: UserID;
  name: string;
  email: string;

  static schema = Type.Object({
    id: Type.Integer({ minimum: 0 }),
    name: UserNameUniString({
      minLength: 2,
      maxLength: 50,
    }),
    email: EmailString({ maxLength: 100 }),
  });
  static #validator = new SafeValidator(this.schema);

  /**
   * Create a new user.
   * @param fields The user's properties. `id` is optional, but
   *  must be 0 for users not yet in the database.
   */
  constructor(
    fields: SelectivePartial<FieldsOf<User>, "id">,
    assumeValid = false
  ) {
    this.id = fields.id ?? (0 as UserID);
    this.name = fields.name;
    this.email = fields.email;

    if (!assumeValid) {
      User.#validator.safeValidate(this, "Invalid user");
    }
    freezeField(this, "id");
  }

  /**
   * Returns the user's ID.
   * @returns the user's ID.
   */
  getKey(): [UserID] {
    return [this.id];
  }
}
export interface User {
  readonly __typeID: unique symbol;
}
