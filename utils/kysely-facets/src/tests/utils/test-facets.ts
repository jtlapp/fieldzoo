import { Insertable, Kysely, Selectable } from "kysely";

import { StandardFacet } from "../../index";
import { Database, Users } from "./test-tables";

export class StdUserFacet extends StandardFacet<
  Database,
  "users",
  Selectable<Users>,
  Insertable<Users>,
  Partial<Insertable<Users>>
> {
  constructor(readonly db: Kysely<Database>) {
    super(db, "users");
  }
}

export class StdUserFacetReturningID extends StandardFacet<
  Database,
  "users",
  Selectable<Users>,
  Insertable<Users>,
  Partial<Insertable<Users>>,
  ["id"]
> {
  constructor(readonly db: Kysely<Database>) {
    super(db, "users", { returnColumns: ["id"] });
  }
}

export class StdUserFacetReturningIDAndHandle extends StandardFacet<
  Database,
  "users",
  Selectable<Users>,
  Insertable<Users>,
  Partial<Insertable<Users>>,
  ["id", "handle"]
> {
  constructor(readonly db: Kysely<Database>) {
    super(db, "users", { returnColumns: ["id", "handle"] });
  }
}

export class StdUserFacetExplicitlyReturningAll extends StandardFacet<
  Database,
  "users",
  Selectable<Users>,
  Insertable<Users>,
  Partial<Insertable<Users>>,
  []
> {
  constructor(readonly db: Kysely<Database>) {
    super(db, "users");
  }
}
