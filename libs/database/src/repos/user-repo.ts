import {
  Kysely,
  Selectable,
  Insertable,
  // Updateable,
} from "kysely";
import { WhereGrouper } from "kysely/dist/cjs/parser/binary-operation-parser";
import { From } from "kysely/dist/cjs/parser/table-parser";

import { UserTable, Database } from "../tables/current-tables";

export class UserRepo {
  constructor(readonly db: Kysely<Database>) {}

  async deleteById(id: number): Promise<boolean> {
    const result = await this.db
      .deleteFrom("users")
      .where("users.id", "=", id)
      .executeTakeFirst();
    return Number(result.numDeletedRows) == 1;
  }

  async find(
    whereGrouper: WhereGrouper<From<Database, "users">, "users">,
  ): Promise<Selectable<UserTable[]> | null> {
    const users = await this.db
      .selectFrom("users")
      .selectAll()
      .where(whereGrouper)
      .executeTakeFirst();
    return users || null;
  }

  async findById(id: number): Promise<Selectable<UserTable> | null> {
    const user = await this.db
      .selectFrom("users")
      .selectAll()
      .where("users.id", "=", id)
      .executeTakeFirst();
    return user || null;
  }

  async insert(user: Insertable<UserTable>): Promise<number> {
    const { id } = await this.db
      .insertInto("users")
      .values(user)
      .returning("id")
      .executeTakeFirstOrThrow();
    return id;
  }
}
