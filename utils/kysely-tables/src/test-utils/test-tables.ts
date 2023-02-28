import { Kysely, Generated } from "kysely";

import { KyselyTable } from "../lib/kysely-table";
import { KyselyTableWithID } from "../lib/kysely-table-with-id";

// list tables after those they depend on
const TABLE_NAMES = ["comments", "posts", "users"];

export interface Users {
  id: Generated<number>;
  handle: string;
  email: string;
}

export interface Posts {
  id: Generated<number>;
  userId: number;
  title: string;
  likeCount: number;
}

export interface Comments {
  userId: number;
  text: string;
}

export interface Database {
  users: Users;
  posts: Posts;
  comments: Comments;
}

export async function createTables(db: Kysely<Database>) {
  await _createTableWithId(db, "users")
    .addColumn("handle", "varchar(255)", (col) => col.notNull())
    .addColumn("email", "varchar(255)")
    .execute();

  await _createTableWithId(db, "posts")
    .addColumn("userId", "integer", (col) =>
      col.references("user.id").onDelete("cascade").notNull()
    )
    .addColumn("title", "varchar(255)", (col) => col.unique().notNull())
    .addColumn("likeCount", "integer", (col) => col.notNull())
    .execute();

  await db.schema
    .createTable("comments")
    .addColumn("postId", "integer", (col) =>
      col.references("post.id").notNull()
    )
    .addColumn("text", "varchar(255)", (col) => col.notNull())
    .execute();

  return db;
}

export async function dropTables(db: Kysely<Database>): Promise<void> {
  for (const table of TABLE_NAMES) {
    await db.schema.dropTable(table).ifExists().execute();
  }
}

export class UserTable extends KyselyTableWithID<Database, "users", "id"> {
  constructor(readonly db: Kysely<Database>) {
    super(db, "users", "id");
  }
}

export class PostTable extends KyselyTableWithID<Database, "posts", "id"> {
  constructor(readonly db: Kysely<Database>) {
    super(db, "posts", "id");
  }
}

export class CommentTable extends KyselyTable<Database, "comments"> {
  constructor(readonly db: Kysely<Database>) {
    super(db, "comments");
  }
}

function _createTableWithId(db: Kysely<Database>, tableName: string) {
  return db.schema
    .createTable(tableName)
    .addColumn("id", "integer", (col) => col.autoIncrement().primaryKey());
}
