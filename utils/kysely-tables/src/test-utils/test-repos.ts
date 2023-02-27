import { Kysely } from "kysely";

import { KyselyTable } from "../lib/kysely-table";
import { Database } from "./test-setup";

export class UserTable extends KyselyTable<Database, "users", "id"> {
  constructor(readonly db: Kysely<Database>) {
    super(db, "users", "id");
  }
}
