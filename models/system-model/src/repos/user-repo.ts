import { Kysely } from "kysely";
import { TableMapper } from "kysely-mapper";
import { ValidationException } from "typebox-validators";

import { createBase64UUID } from "@fieldzoo/base64-uuid";
import { TimestampedTable } from "@fieldzoo/general-model";

import { Database, UserProfiles } from "../tables/table-interfaces";
import { User } from "../entities/user.js";
import { UserID } from "../values/user-id.js";
import { toUserHandle } from "../values/user-handle.js";

/**
 * Repository for persisted users.
 */
export class UserRepo {
  readonly #table: ReturnType<UserRepo["getMapper"]>;

  constructor(readonly db: Kysely<Database>) {
    this.#table = this.getMapper(db);
  }

  /**
   * Adds a user to the repository.
   * @param user User to add.
   * @returns A new user instance with its assigned UUID.
   * @throws DatabaseErrpr, such as when the user handle or
   *  email is not unique.
   */
  async add(user: User): Promise<User> {
    return await this.#table.insert().returnOne(user);
  }

  /**
   * Deletes a user by ID, including all resources that the user owns.
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
    return this.#table.select(id).returnOne();
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
          .selectFrom("users")
          .where("handle", "=", toUserHandle(handle, true))
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
   * Updates a user, including changing its `modifiedAt` date.
   * @param user User with modified values.
   * @returns Whether the user was found and updated.
   * @throws DatabaseErrpr, such as when the user handle or
   *  email is not unique.
   */
  async update(user: User): Promise<boolean> {
    return (await this.#table.update(user.id).returnOne(user)) !== null;
  }

  /**
   * Gets a mapper for the users table. This is a method so that the
   * mapper type can be inferred from its options without having to
   * specify the type parameters.
   */
  private getMapper(db: Kysely<Database>) {
    return new TableMapper(db, "users", {
      keyColumns: ["id"],
      insertReturnColumns:
        TimestampedTable.addInsertReturnColumns<UserProfiles>(["id"]),
      updateReturnColumns:
        TimestampedTable.addUpdateReturnColumns<UserProfiles>(),
    }).withTransforms({
      insertTransform: (user: User) =>
        TimestampedTable.removeGeneratedValues({
          ...user,
          id: createBase64UUID(),
        }),
      insertReturnTransform: (user: User, returns) =>
        User.castFrom({ ...user, ...returns }, false),
      updateTransform: (user: User) => {
        const values = TimestampedTable.removeGeneratedValues({ ...user });
        delete values["id"];
        return values;
      },
      updateReturnTransform: (user: User, returns) =>
        Object.assign(user, returns) as User,
      selectTransform: (row) => User.castFrom(row, false),
      countTransform: (count) => Number(count),
    });
  }
}
