import { Kysely } from "kysely";

import { User, UserID } from "@fieldzoo/model";
import { OrmTableFacet } from "@fieldzoo/kysely-facets";

import { Database } from "../tables/current-tables";

/**
 * Repository for persisting users.
 */
export class UserRepo {
  readonly #tableFacet: OrmTableFacet<Database, "users", "id", User>;

  constructor(readonly db: Kysely<Database>) {
    this.#tableFacet = new OrmTableFacet(db, "users", "id", {
      insertReturnTransform: (user, returns) => {
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
    return this.#tableFacet.deleteById(id);
  }

  /**
   * Get a user by ID.
   * @param id ID of the user to get.
   * @returns the user, or null if the user was not found.
   */
  async getByID(id: UserID): Promise<User | null> {
    return this.#tableFacet.selectById(id);
  }

  /**
   * Insert or update a user. Users with ID 0 are inserted;
   * users with non-zero IDs are updated.
   * @param user User to insert or update.
   * @returns the user, or null if the user-to-update was not found.
   */
  async store(user: User): Promise<User | null> {
    return this.#tableFacet.upsert(user);
  }
}
