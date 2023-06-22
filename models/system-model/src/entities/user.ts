import { Type } from "@sinclair/typebox";
import { CompilingStandardValidator } from "typebox-validators/standard";

import { UnvalidatedFields } from "@fieldzoo/generic-types";
import { freezeField } from "@fieldzoo/freeze-field";
import { EmailAddress, TimestampedEntity } from "@fieldzoo/general-model";

import { UserID } from "../values/user-id";
import { UserName, UserNameImpl } from "../values/user-name";
import { UserHandle, UserHandleImpl } from "../values/user-handle";

// TODO: if I keeping this, get createAt, modifiedAt from TimestampedEntity
export const READONLY_USER_FIELDS = [
  "id",
  "email",
  "lastSignInAt",
  "bannedUntil",
  "createdAt",
  "modifiedAt",
  "deletedAt",
] as const;

/**
 * Class representing a valid user.
 */
export class User extends TimestampedEntity {
  static schema = Type.Object({
    name: UserNameImpl.schema,
    handle: UserHandleImpl.schema,
  });
  static #validator = new CompilingStandardValidator(this.schema);

  /**
   * @param id User ID, as assigned by Supabase.
   * @param email User's email address
   * @param name User's name. May be null because the initial name is
   *  acquired from the login account provider, but there is no standard
   *  for communicating this name.
   * @param handle User's unique handle. Initially null.
   * @param lastSignInAt The date/time at which the user last logged in.
   * @param bannedUntil The date/time at which the user's ban expires.
   * @param createdAt The date/time at which the user was created.
   * @param modifiedAt The date/time at which the user was last modified.
   * @param deletedAt The date/time at which the user was deleted.
   */
  constructor(
    readonly id: UserID,
    readonly email: EmailAddress,
    public name: UserName | null,
    public handle: UserHandle | null,
    readonly lastSignInAt: Date,
    readonly bannedUntil: Date | null,
    createdAt: Date,
    modifiedAt: Date,
    readonly deletedAt: Date | null
  ) {
    super(createdAt, modifiedAt);
    freezeField(this, "id");
  }

  /**
   * Updates a user from the provided fields.
   * @param fields The user's properties.
   * @throws {ValidationException} if `fields` is invalid.
   */
  updateFrom(
    fields: Readonly<
      Omit<UnvalidatedFields<User>, (typeof READONLY_USER_FIELDS)[number]>
    >
  ) {
    User.#validator.assert(fields, "Invalid user");
    this.name = fields.name as UserName;
    this.handle = fields.handle as UserHandle;
  }

  /**
   * Create a user from fields
   * @param fields The user's properties.
   * @returns A new user.
   */
  static createFrom(fields: Readonly<UnvalidatedFields<User>>) {
    // TODO: no validation here?
    return new User(
      fields.id as UserID,
      fields.email as EmailAddress,
      fields.name as UserName | null,
      fields.handle as UserHandle | null,
      fields.lastSignInAt as Date,
      fields.bannedUntil as Date | null,
      fields.createdAt as Date,
      fields.modifiedAt as Date,
      fields.deletedAt as Date | null
    );
  }
}
export interface User {
  readonly __validated__: unique symbol;
}
