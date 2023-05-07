import { Type } from "@sinclair/typebox";
import * as crypto from "crypto";
import { zxcvbn, zxcvbnOptions } from "@zxcvbn-ts/core";
import zxcvbnCommonPackage from "@zxcvbn-ts/language-common";
import zxcvbnEnPackage from "@zxcvbn-ts/language-en";

import { getPlatformConfig } from "@fieldzoo/app-config";
import { SelectivePartial, UnvalidatedFields } from "@fieldzoo/generic-types";
import {
  MultitierValidator,
  ValidationException,
} from "@fieldzoo/multitier-validator";
import { freezeField } from "@fieldzoo/freeze-field";
import { Nullable, Zeroable } from "@fieldzoo/typebox-types";
import { TimestampedColumns, TimestampedEntity } from "@fieldzoo/modeling";

import { UserID, UserIDImpl } from "../values/user-id";
import { UserName, UserNameImpl } from "../values/user-name";
import { EmailAddress, EmailAddressImpl } from "../values/email-address";

const PASSWORD_HASH_LENGTH = 64;

zxcvbnOptions.setOptions({
  translations: zxcvbnEnPackage.translations,
  graphs: zxcvbnCommonPackage.adjacencyGraphs,
  dictionary: {
    ...zxcvbnCommonPackage.dictionary,
    ...zxcvbnEnPackage.dictionary,
  },
});

/**
 * Class representing a valid user.
 */
export class User extends TimestampedEntity {
  #passwordHash: string | null = null;
  #passwordSalt: string | null = null;

  static schema = Type.Object({
    id: Zeroable(UserIDImpl.schema),
    name: UserNameImpl.schema,
    email: EmailAddressImpl.schema,
    accessRevoked: Nullable(Type.Date()),
    createdAt: super.timestampedSchema.createdAt,
    modifiedAt: super.timestampedSchema.modifiedAt,
  });
  static #validator = new MultitierValidator(this.schema);

  /**
   * @param id User ID. `id` must be 0 for users not yet in the database.
   * @param name User name.
   * @param email User email address.
   * @param accessRevoked The date/time at which the user's access was revoked,
   *  or null if the user's access has not been revoked.
   * @param passwordHash The user's password hash.
   * @param passwordSalt The user's password salt.
   * @param createdAt The date/time at which the user was created.
   * @param modifiedAt The date/time at which the user was last modified.
   */
  constructor(
    readonly id: UserID,
    public name: UserName,
    public email: EmailAddress,
    public accessRevoked: Date | null = null,
    passwordHash?: string | null,
    passwordSalt?: string | null,
    createdAt?: Date,
    modifiedAt?: Date
  ) {
    super(createdAt, modifiedAt);
    this.#passwordHash = passwordHash ?? null;
    this.#passwordSalt = passwordSalt ?? null;
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
      SelectivePartial<UnvalidatedFields<User>, "id" | TimestampedColumns> & {
        passwordHash: string | null;
        passwordSalt: string | null;
      }
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
      fields.accessRevoked as Date | null,
      fields.passwordHash as string | null,
      fields.passwordSalt as string | null,
      fields.createdAt as Date,
      fields.modifiedAt as Date
    );
  }

  /**
   * Returns the logarithm of the estimated number of guesses that would be
   * needed to crack the provided password.
   * @param password The password to be tested.
   * @returns The logarithm of the estimated number of guesses.
   * @see https://www.usenix.org/conference/usenixsecurity16/technical-sessions/presentation/wheeler
   */
  static getPasswordStrength(password: string): number {
    return zxcvbn(password).guessesLog10;
  }

  /**
   * Assigns the user's password by generating a salted hash. The password
   * cannot begin or end with spaces, and must have at least the minimum
   * configured password strength. Does not store the hash in the database.
   * @param password The password to be assigned.
   */
  async setPassword(password: string): Promise<void> {
    if (password != password.trim()) {
      throw new ValidationException("Password can't begin or end with spaces");
    }
    const config = getPlatformConfig();
    if (User.getPasswordStrength(password) < config.minPasswordStrength) {
      throw new ValidationException("Password not strong enough");
    }
    return new Promise((resolve, reject) => {
      const salt = crypto.randomBytes(16).toString("hex");
      crypto.scrypt(password, salt, PASSWORD_HASH_LENGTH, (err, derivedKey) => {
        if (err) return reject(err);
        this.#passwordSalt = salt;
        this.#passwordHash = derivedKey.toString("hex");
        resolve();
      });
    });
  }

  /**
   * Verifies that the provided password matches the user's password by
   * comparing their salted hashes. Verification fails if either the user
   * has no password or the user's access was revoked.
   * @param password The password to be verified.
   * @returns Whether the password matches.
   */
  async verifyPassword(password: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (
        typeof password != "string" ||
        this.accessRevoked !== null ||
        this.#passwordHash === null ||
        this.#passwordSalt === null
      ) {
        return resolve(false);
      }
      crypto.scrypt(
        password,
        this.#passwordSalt,
        PASSWORD_HASH_LENGTH,
        (err, derivedKey) => {
          if (err) return reject(err);
          resolve(this.#passwordHash == derivedKey.toString("hex"));
        }
      );
    });
  }
}
export interface User {
  readonly __validated__: unique symbol;
}
