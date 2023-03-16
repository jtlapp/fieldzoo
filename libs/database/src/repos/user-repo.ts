import { Kysely } from "kysely";

import { IdTableFacet } from "@fieldzoo/kysely-facets";

import { Database } from "../tables/current-tables";

// TODO: aggregate, don't extend TableFacet
export class UserRepo extends IdTableFacet<Database, "users", "id"> {
  constructor(readonly db: Kysely<Database>) {
    super(db, "users", "id");
  }
}
