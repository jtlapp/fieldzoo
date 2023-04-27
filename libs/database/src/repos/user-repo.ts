import { Kysely } from "kysely";

import { User } from "@fieldzoo/model";
import { TableMapper } from "kysely-mapper";

import { Database } from "../tables/current-tables";
import { UserID } from "@fieldzoo/model";

/**
 * Repository for persisting users.
 */
export class UserRepo {
  readonly #table: ReturnType<UserRepo["getMapper"]>;

  constructor(readonly db: Kysely<Database>) {
    this.#table = this.getMapper(db);
  }

  /**
   * Delete a user by ID.
   * @param id ID of the user to delete.
   * @returns true if the user was deleted, false if the user was not found.
   */
  async deleteByID(id: UserID): Promise<boolean> {
    return this.#table.delete(id).run();
  }

  /**
   * Get a user by ID.
   * @param id ID of the user to get.
   * @returns the user, or null if the user was not found.
   */
  async getByID(id: UserID): Promise<User | null> {
    return this.#table.select(id).returnOne();
  }

  /**
   * Insert or update a user. Users with ID 0 are inserted;
   * users with non-zero IDs are updated.
   * @param user User to insert or update.
   * @returns the user, or null if the user-to-update was not found.
   */
  async store(user: User): Promise<User | null> {
    return user.id
      ? await this.#table.update(user.id).returnOne(user)
      : this.#table.insert().returnOne(user);
  }

  /**
   * Get a mapper for the users table. This is a method so that the
   * mapper type can be inferred from its options without having to
   * specify the type parameters.
   */
  private getMapper(db: Kysely<Database>) {
    const upsertTransform = (user: User) => {
      const update = { ...user } as any;
      delete update["id"];
      delete update["createdAt"];
      delete update["modifiedAt"];
      return update;
    };

    return new TableMapper(db, "users", {
      keyColumns: ["id"],
      insertReturnColumns: ["id", "createdAt", "modifiedAt"],
      updateReturnColumns: ["modifiedAt"],
    }).withTransforms({
      insertTransform: upsertTransform,
      insertReturnTransform: (user: User, returns) =>
        User.create(
          {
            ...user,
            id: returns.id,
            createdAt: returns.createdAt,
            modifiedAt: returns.modifiedAt,
          },
          false
        ),
      updateTransform: upsertTransform,
      updateReturnTransform: (user: User, returns) =>
        User.create(
          {
            ...user,
            createdAt: user.createdAt, // spread won't get getters
            modifiedAt: returns.modifiedAt,
          },
          false
        ),
      selectTransform: (row) => User.create(row, false),
      countTransform: (count) => Number(count),
    });
  }
}
