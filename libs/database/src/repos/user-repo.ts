import { Kysely } from "kysely";

import { User, UserID } from "@fieldzoo/model";
import { IdTableFacet } from "@fieldzoo/kysely-facets";

import { Database } from "../tables/current-tables";

export class UserRepo {
  readonly #tableFacet: IdTableFacet<
    Database,
    "users",
    "id",
    User,
    User,
    User,
    ["id"],
    User
  >;
  constructor(readonly db: Kysely<Database>) {
    this.#tableFacet = new IdTableFacet(db, "users", "id", {
      insertTransform: (user) => {
        if (user.id !== 0) {
          throw Error("Inserted users must have id 0");
        }
        return { ...user, id: undefined };
      },
      insertReturnTransform: (user, returns) => {
        return new User({ ...user, id: returns.id as UserID }, true);
      },
      selectTransform: (row) =>
        new User({ ...row, id: row.id as UserID }, true),
    });
  }

  async deleteById(id: UserID): Promise<boolean> {
    return this.#tableFacet.deleteById(id);
  }

  async getByID(id: UserID): Promise<User | null> {
    return this.#tableFacet.selectById(id);
  }

  async store(user: User): Promise<User> {
    if (user.id === 0) {
      return await this.#tableFacet.insertReturning(user);
    }
    await this.#tableFacet.updateById(user);
    return user;
  }
}
