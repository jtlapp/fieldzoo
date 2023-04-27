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
  #createdAt?: Date;
  #modifiedAt?: Date;

  static schema = Type.Object({
    id: Zeroable(UserIDImpl.schema),
    name: UserNameImpl.schema,
    email: EmailAddressImpl.schema,
    createdAt: Type.Optional(Type.Date()),
    modifiedAt: Type.Optional(Type.Date()),
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
    public email: EmailAddress,
    createdAt?: Date,
    modifiedAt?: Date
  ) {
    freezeField(this, "id");
    this.#createdAt = createdAt;
    this.#modifiedAt = modifiedAt;
  }

  /**
   * Returns the date on which the user was created.
   * @returns The date on which the user was created.
   */
  get createdAt(): Date {
    if (this.#createdAt === undefined) {
      throw new Error("User has no creation date");
    }
    return this.#createdAt;
  }

  /**
   * Returns the date on which the user was last modified.
   * @returns The date on which the user was last modified.
   */
  get modifiedAt(): Date {
    if (this.#modifiedAt === undefined) {
      throw new Error("User has no modification date");
    }
    return this.#modifiedAt;
  }

  /**
   * Casts a new User from fields, optionally with validation.
   * @param fields The user's properties. `id` is optional, defaulting to
   *  0 for users not yet in the database.
   * @param validate Whether to validate the fields. Defaults to true.
   * @returns A new user.
   */
  static castFrom(
    fields: Readonly<
      SelectivePartial<
        UnvalidatedFields<User>,
        "id" | "createdAt" | "modifiedAt"
      >
    >,
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
      fields.email as EmailAddress,
      fields.createdAt as Date,
      fields.modifiedAt as Date
    );
  }
}
export interface User {
  readonly __validated__: unique symbol;
}
