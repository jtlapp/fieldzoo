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
  async deleteById(id: UserID): Promise<boolean> {
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
      ? (await this.#table.update(user.id).run(user))
        ? user
        : null
      : this.#table.insert().returnOne(user);
  }

  /**
   * Get a mapper for the users table. This is a method so that the
   * mapper type can be inferred from its options without having to
   * specify the type parameters.
   */
  private getMapper(db: Kysely<Database>) {
    return new TableMapper(db, "users", {
      keyColumns: ["id"],
    }).withTransforms({
      insertTransform: (user: User) => {
        const insertion = { ...user } as any;
        delete insertion["id"];
        return insertion;
      },
      insertReturnTransform: (user: User, returns) =>
        User.create({ ...user, id: returns.id as UserID }, true),
      selectTransform: (row) =>
        User.create({ ...row, id: row.id as UserID }, true),
      countTransform: (count) => Number(count),
    });
  }
}
