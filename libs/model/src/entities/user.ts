import { Type } from "@sinclair/typebox";

import { SelectivePartial, UnvalidatedFields } from "@fieldzoo/generic-types";
import { MultitierValidator } from "@fieldzoo/multitier-validator";
import { freezeField } from "@fieldzoo/freeze-field";

import { UserID, UserIDImpl } from "../values/user-id";
import { UserName, UserNameImpl } from "../values/user-name";
import { EmailAddress, EmailAddressImpl } from "../values/email-address";
import { Zeroable } from "@fieldzoo/typebox-types";

/**
 * Class representing a valid user.
 */
export class User {
  static schema = Type.Object({
    id: Zeroable(UserIDImpl.schema),
    name: UserNameImpl.schema,
    email: EmailAddressImpl.schema,
  });
  static #validator = new MultitierValidator(this.schema);

  /**
   * @param id User ID. `id` must be 0 for users not yet in the database.
   * @param name User name.
   * @param email User email address.
   */
  constructor(
    readonly id: UserID,
    public name: UserName,
    public email: EmailAddress
  ) {
    freezeField(this, "id");
  }

  /**
   * Create a new user, optionally with validation.
   * @param fields The user's properties. `id` is optional, defaulting to
   *  0 for users not yet in the database.
   * @param validate Whether to validate the fields. Defaults to true.
   * @returns A new user.
   */
  static create(
    fields: Readonly<SelectivePartial<UnvalidatedFields<User>, "id">>,
    validate = true
  ) {
    if (fields.id === undefined) {
      fields = { ...fields, id: 0 };
    }
    if (validate) {
      User.#validator.safeValidate(fields, "Invalid user");
    }
    return new User(
      fields.id as UserID,
      fields.name as UserName,
      fields.email as EmailAddress
    );
  }
}
export interface User {
  readonly __validated__: unique symbol;
}
