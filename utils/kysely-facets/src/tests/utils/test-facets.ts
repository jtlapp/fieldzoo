import { Insertable, Kysely, Selectable } from "kysely";

import { TableFacet } from "../../facets/TableFacet";
import { Database, Users } from "./test-tables";

export class UserTableFacetReturningDefault extends TableFacet<
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

export class UserTableFacetReturningNothing extends TableFacet<
  Database,
  "users",
  Selectable<Users>,
  Insertable<Users>,
  Partial<Insertable<Users>>,
  []
> {
  constructor(readonly db: Kysely<Database>) {
    super(db, "users", { returnColumns: [] });
  }
}

export class UserTableFacetReturningID extends TableFacet<
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

export class UserTableFacetReturningIDAndHandle extends TableFacet<
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

export class UserTableFacetReturningAll extends TableFacet<
  Database,
  "users",
  Selectable<Users>,
  Insertable<Users>,
  Partial<Insertable<Users>>,
  ["*"]
> {
  constructor(readonly db: Kysely<Database>) {
    super(db, "users", { returnColumns: ["*"] });
  }
}
