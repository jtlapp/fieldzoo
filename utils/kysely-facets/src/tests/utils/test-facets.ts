import { Kysely } from "kysely";

import { StandardFacet, IdFacet } from "../../index";
import { Database } from "./test-tables";

export class UserFacet extends IdFacet<Database, "users", "id"> {
  constructor(readonly db: Kysely<Database>) {
    super(db, "users", "id");
  }
}

export class PostFacet extends IdFacet<Database, "posts", "id"> {
  constructor(readonly db: Kysely<Database>) {
    super(db, "posts", "id");
  }
}

export class CommentFacet extends StandardFacet<Database, "comments"> {
  constructor(readonly db: Kysely<Database>) {
    super(db, "comments");
  }
}
