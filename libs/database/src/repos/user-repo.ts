import { Kysely } from "kysely";

import { KyselyTableWithID } from "@fieldzoo/kysely-tables";

import { Database } from "../tables/current-tables";

// TODO: aggregate, don't extend KyselyTable
export class UserRepo extends KyselyTableWithID<Database, "users", "id"> {
  constructor(readonly db: Kysely<Database>) {
    super(db, "users", "id");
  }
}
