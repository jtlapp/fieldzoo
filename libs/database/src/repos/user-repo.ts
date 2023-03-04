import { Kysely } from "kysely";

import { UniqueIdFacet } from "@fieldzoo/kysely-facets";

import { Database } from "../tables/current-tables";

// TODO: aggregate, don't extend BasicQueryFacet
export class UserRepo extends UniqueIdFacet<Database, "users", "id"> {
  constructor(readonly db: Kysely<Database>) {
    super(db, "users", "id");
  }
}
