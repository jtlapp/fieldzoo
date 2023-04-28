import { Type } from "@sinclair/typebox";

import { SelectivePartial, UnvalidatedFields } from "@fieldzoo/generic-types";
import { MultitierValidator } from "@fieldzoo/multitier-validator";
import { freezeField } from "@fieldzoo/freeze-field";

import { UserID, UserIDImpl } from "../values/user-id";
import { UserName, UserNameImpl } from "../values/user-name";
import { EmailAddress, EmailAddressImpl } from "../values/email-address";
import { Zeroable } from "@fieldzoo/typebox-types";
import {
  TimestampedColumns,
  TimestampedEntity,
} from "../lib/timestamped-entity";

/**
 * Class representing a valid user.
 */
export class User extends TimestampedEntity {
  static schema = Type.Object({
    id: Zeroable(UserIDImpl.schema),
    name: UserNameImpl.schema,
    email: EmailAddressImpl.schema,
    createdAt: super.timestampedSchema.createdAt,
    modifiedAt: super.timestampedSchema.modifiedAt,
  });
  static #validator = new MultitierValidator(this.schema);

  /**
   * @param id User ID. `id` must be 0 for users not yet in the database.
   * @param name User name.
   * @param email User email address.
   * @param createdAt The date/time at which the user was created.
   * @param modifiedAt The date/time at which the user was last modified.
   */
  constructor(
    readonly id: UserID,
    public name: UserName,
    public email: EmailAddress,
    createdAt?: Date,
    modifiedAt?: Date
  ) {
    super(createdAt, modifiedAt);
    freezeField(this, "id");
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
      SelectivePartial<UnvalidatedFields<User>, "id" | TimestampedColumns>
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
