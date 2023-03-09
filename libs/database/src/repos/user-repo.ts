import { Kysely } from "kysely";

import { StandardIdFacet } from "@fieldzoo/kysely-facets";

import { Database } from "../tables/current-tables";

// TODO: aggregate, don't extend StandardFacet
export class UserRepo extends StandardIdFacet<Database, "users", "id"> {
  constructor(readonly db: Kysely<Database>) {
    super(db, "users", "id");
  }
}
