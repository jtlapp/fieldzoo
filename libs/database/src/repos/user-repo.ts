import { Kysely } from "kysely";
import { TableMapper } from "kysely-mapper";

import { User, UserID } from "@fieldzoo/model";
import { TimestampedTable } from "@fieldzoo/modeling";

import { Database, Users } from "../tables/table-interfaces";

/**
 * Repository for persisting users.
 */
export class UserRepo {
  readonly #table: ReturnType<UserRepo["getMapper"]>;

  constructor(readonly db: Kysely<Database>) {
    this.#table = this.getMapper(db);
  }

  /**
   * Adds a user to the repository.
   * @param user User to add.
   * @returns A new user instance with its generated ID.
   */
  async add(user: User): Promise<User> {
    return this.#table.insert().returnOne(user);
  }

  /**
   * Deletes a user by ID.
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
   * Updates a user, including changing its `modifiedAt` date.
   * @param user User with modified values.
   * @returns Whether the user was found and updated.
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
    const upsertTransform = (user: User) => {
      const values = TimestampedTable.getUpsertValues(user);
      delete values["id"];
      return values;
    };

    return new TableMapper(db, "users", {
      keyColumns: ["id"],
      insertReturnColumns: TimestampedTable.getInsertReturnColumns<Users>([
        "id",
      ]),
      updateReturnColumns: TimestampedTable.getUpdateReturnColumns<Users>(),
    }).withTransforms({
      insertTransform: upsertTransform,
      insertReturnTransform: (user: User, returns) =>
        User.castFrom({ ...user, ...returns, id: returns.id }, false),
      updateTransform: upsertTransform,
      updateReturnTransform: (user: User, returns) =>
        Object.assign(user, returns) as User,
      selectTransform: (row) => User.castFrom(row, false),
      countTransform: (count) => Number(count),
    });
  }
}
