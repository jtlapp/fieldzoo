import { Kysely } from "kysely";
import { TableMapper } from "kysely-mapper";
import { ValidationException } from "typebox-validators";
import { DatabaseError } from "pg";

import { TimestampedTable } from "@fieldzoo/modeling";

import { Database, UserProfiles } from "../tables/table-interfaces";
import { User, READONLY_USER_FIELDS } from "../entities/user";
import { UserID } from "../values/user-id";
import { UserHandleImpl } from "../values/user-handle";

/**
 * Repository for persisted users, combining columns from both the
 * `user_profiles` table and Supabase's `auth.users` table.
 */
export class UserRepo {
  readonly #table: ReturnType<UserRepo["getMapper"]>;

  constructor(readonly db: Kysely<Database>) {
    this.#table = this.getMapper(db);
  }

  /**
   * Indicates whether the provided user handle is valid and unique.
   * @param handle User handle to check.
   * @returns true if the handle is valid and unique, false otherwise.
   */
  async isHandleAvailable(handle: string): Promise<boolean> {
    try {
      return (
        (await this.db
          .selectFrom("user_profiles")
          .where("handle", "=", UserHandleImpl.castFrom(handle, true))
          .executeTakeFirst()) === undefined
      );
    } catch (e: any) {
      if (e instanceof ValidationException) {
        return false;
      }
      throw e;
    }
  }

  /**
   * Deletes a user by ID. Users are not automatically deleted from this
   * repository when they are deleted from Supabase.
   * @param id ID of the user to delete.
   * @returns true if the user was deleted, false if the user was not found.
   */
  async deleteByID(id: UserID): Promise<boolean> {
    return this.#table.delete(id).run();
  }

  /**
   * Gets a user by ID.
   * @param id ID of the user to get.
   * @returns the user, or null if the user was not found.
   */
  async getByID(id: UserID): Promise<User | null> {
    const result = await this.db
      .selectFrom("user_profiles")
      .innerJoin("auth.users", "user_profiles.id", "auth.users.id")
      .select([
        "user_profiles.id",
        "auth.users.email",
        "user_profiles.name",
        "user_profiles.handle",
        "auth.users.last_sign_in_at as lastSignInAt",
        "auth.users.banned_until as bannedUntil",
        "user_profiles.createdAt",
        "user_profiles.modifiedAt",
        "auth.users.deleted_at as deletedAt",
      ])
      .where("user_profiles.id", "=", id)
      .executeTakeFirst();
    return result === undefined ? null : User.createFrom(result);
  }

  /**
   * Updates a user, including changing its `modifiedAt` date.
   * @param user User with modified values.
   * @returns Whether the user was found and updated.
   * @throws ValidationException if the user's handle is already in use.
   */
  async update(user: User): Promise<boolean> {
    try {
      return (await this.#table.update(user.id).returnOne(user)) !== null;
    } catch (e: any) {
      if (e instanceof DatabaseError && e.code === "23505") {
        // unique_violation
        throw new ValidationException("User handle is already in use");
      }
      throw e;
    }
  }

  /**
   * Gets a mapper for the users table. This is a method so that the
   * mapper type can be inferred from its options without having to
   * specify the type parameters.
   */
  private getMapper(db: Kysely<Database>) {
    return new TableMapper(db, "user_profiles", {
      keyColumns: ["id"],
      updateReturnColumns:
        TimestampedTable.addUpdateReturnColumns<UserProfiles>(),
    }).withTransforms({
      insertTransform: () => {
        throw Error("Cannot insert users");
      },
      updateTransform: (user: User) => {
        const values = TimestampedTable.removeGeneratedValues({ ...user });
        READONLY_USER_FIELDS.forEach((field) => delete values[field]);
        return values;
      },
      updateReturnTransform: (user: User, returns) =>
        Object.assign(user, returns) as User,
      selectTransform: () => () => {
        throw Error("Cannot select users via mapper");
      },
      countTransform: (count) => Number(count),
    });
  }
}
