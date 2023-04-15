import { Kysely } from "kysely";

import { User, UserID } from "@fieldzoo/model";
import { UniformTableMapper } from "kysely-mapper";

import { Database } from "../tables/current-tables";

/**
 * Repository for persisting users.
 */
export class UserRepo {
  readonly #mapper: ReturnType<UserRepo["getMapper"]>;

  constructor(readonly db: Kysely<Database>) {
    this.#mapper = this.getMapper(db);
  }

  /**
   * Delete a user by ID.
   * @param id ID of the user to delete.
   * @returns true if the user was deleted, false if the user was not found.
   */
  async deleteById(id: UserID): Promise<boolean> {
    return this.#mapper.delete(id).run();
  }

  /**
   * Get a user by ID.
   * @param id ID of the user to get.
   * @returns the user, or null if the user was not found.
   */
  async getByID(id: UserID): Promise<User | null> {
    return this.#mapper.select(id).getOne();
  }

  /**
   * Insert or update a user. Users with ID 0 are inserted;
   * users with non-zero IDs are updated.
   * @param user User to insert or update.
   * @returns the user, or null if the user-to-update was not found.
   */
  async store(user: User): Promise<User | null> {
    return user.id
      ? this.#mapper.update(user.id).getOne(user)
      : this.#mapper.insert().getOne(user);
  }

  /**
   * Get a mapper for the users table. This is a method so that the
   * mapper type can be inferred from its options without having to
   * specify the type parameters.
   */
  private getMapper(db: Kysely<Database>) {
    return new UniformTableMapper(db, "users", {
      isMappedObject: (obj) => obj instanceof User,
      insertTransform: (user: User) => {
        const insertion = { ...user } as any;
        delete insertion["id"];
        return insertion;
      },
      insertReturnTransform: (user: User, returns: any) =>
        new User({ ...user, id: returns.id as UserID }, true),
      selectTransform: (row) =>
        new User({ ...row, id: row.id as UserID }, true),
      returnColumns: ["id"],
      countTransform: (count) => Number(count),
    });
  }
}
