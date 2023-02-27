import { Kysely } from "kysely";

import { KyselyRepo } from "../lib/kysely-repo";
import { Database } from "./test-setup";

export class UserRepo extends KyselyRepo<Database, "users", "id"> {
  constructor(readonly db: Kysely<Database>) {
    super(db, "users", "id");
  }
}
