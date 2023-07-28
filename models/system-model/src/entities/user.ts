import { Type } from "@sinclair/typebox";
import { CompilingStandardValidator } from "typebox-validators/standard/index.js";

import { SelectivePartial, UnvalidatedFields } from "@fieldzoo/generic-types";
import { freezeField } from "@fieldzoo/freeze-field";
import {
  EmailAddress,
  toEmailAddress,
  TimestampedColumns,
  TimestampedEntity,
} from "@fieldzoo/general-model";

import { UserID, toUserID } from "../values/user-id.js";
import {
  UserDisplayName,
  toUserDisplayName,
} from "../values/user-display-name.js";
import { UserHandle, toUserHandle } from "../values/user-handle.js";
import { EmptyStringable, Nullable } from "@fieldzoo/typebox-types";

/**
 * Class representing a valid user.
 */
export class User extends TimestampedEntity {
  static schema = Type.Object({
    ...super.timestampedSchema.properties,
    id: EmptyStringable(toUserID.schema),
    email: toEmailAddress.schema,
    displayName: toUserDisplayName.schema,
    userHandle: toUserHandle.schema,
    lastLoginAt: Nullable(Type.Date()),
    disabledAt: Nullable(Type.Date()),
  });
  static #validator = new CompilingStandardValidator(this.schema);

  /**
   * @param id User ID, a base-64 encoded UUID.
   * @param email User's email address
   * @param displayName User's display name. May be null because the initial
   *  name is acquired from the login account provider, but there is no
   *  standard for communicating this name.
   * @param userHandle User's unique handle. Initially null.
   * @param lastLoginAt The date/time at which the user last logged in.
   * @param createdAt The date/time at which the user was created.
   * @param modifiedAt The date/time at which the user was last modified.
   * @param disabledAt The date/time at which the user account was disabled.
   */
  constructor(
    readonly id: UserID,
    public email: EmailAddress,
    public displayName: UserDisplayName | null,
    public userHandle: UserHandle | null,
    public lastLoginAt: Date | null,
    createdAt: Date,
    modifiedAt: Date,
    public disabledAt: Date | null
  ) {
    super(createdAt, modifiedAt);
    freezeField(this, "id");
  }

  /**
   * Cast a new user from fields, optionally with validation.
   * @param fields The user's properties. `id` is optional, defaulting to
   *  the empty string for users not yet in the database.
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
      fields = { ...fields, id: "" };
    }
    if (validate) {
      this.#validator.assert(fields, "Invalid user");
    }

    // TODO: revisit whether to create a new instance, as I could just
    // return the provided fields appropriately typed. (Excpet in this
    // case I might have to add an "ID" field.)
    return new User(
      fields.id as UserID,
      fields.email as EmailAddress,
      fields.displayName as UserDisplayName | null,
      fields.userHandle as UserHandle | null,
      fields.lastLoginAt as Date,
      fields.createdAt as Date,
      fields.modifiedAt as Date,
      fields.disabledAt as Date | null
    );
  }
}
