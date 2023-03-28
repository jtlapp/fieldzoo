import { Kysely } from "kysely";

import { User, UserID } from "@fieldzoo/model";
import { ObjectTableLens } from "@fieldzoo/kysely-lenses";

import { Database } from "../tables/current-tables";

/**
 * Repository for persisting users.
 */
export class UserRepo {
  readonly #tableLens: ObjectTableLens<Database, "users", User>;

  constructor(readonly db: Kysely<Database>) {
    this.#tableLens = new ObjectTableLens(db, "users", ["id"], {
      insertReturnTransform: (user: User, returns: any) => {
        return new User({ ...user, id: returns.id as UserID }, true);
      },
      selectTransform: (row) =>
        new User({ ...row, id: row.id as UserID }, true),
    });
  }

  /**
   * Delete a user by ID.
   * @param id ID of the user to delete.
   * @returns true if the user was deleted, false if the user was not found.
   */
  async deleteById(id: UserID): Promise<boolean> {
    return this.#tableLens.deleteByKey(id);
  }

  /**
   * Get a user by ID.
   * @param id ID of the user to get.
   * @returns the user, or null if the user was not found.
   */
  async getByID(id: UserID): Promise<User | null> {
    return this.#tableLens.selectByKey(id);
  }

  /**
   * Insert or update a user. Users with ID 0 are inserted;
   * users with non-zero IDs are updated.
   * @param user User to insert or update.
   * @returns the user, or null if the user-to-update was not found.
   */
  async store(user: User): Promise<User | null> {
    return user.id
      ? this.#tableLens.update(user)
      : this.#tableLens.insert(user);
  }
}
