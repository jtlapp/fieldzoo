import { Kysely } from "kysely";

import { KyselyRepo } from "@fieldzoo/kysely-repo";

import { Database } from "../tables/current-tables";

export class UserRepo extends KyselyRepo<Database, "users", "id"> {
  constructor(readonly db: Kysely<Database>) {
    super(db, "users", "id");
  }
}
