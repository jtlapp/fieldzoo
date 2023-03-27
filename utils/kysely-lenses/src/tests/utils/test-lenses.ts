import { Insertable, Kysely, Selectable } from "kysely";

import { TableLens } from "../../lenses/TableLens";
import { Database, Users } from "./test-tables";

export class UserTableLensReturningDefault extends TableLens<
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

export class UserTableLensReturningNothing extends TableLens<
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

export class UserTableLensReturningID extends TableLens<
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

export class UserTableLensReturningIDAndHandle extends TableLens<
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

export class UserTableLensReturningAll extends TableLens<
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
