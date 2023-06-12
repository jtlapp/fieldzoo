import Sqlite3 from "better-sqlite3";
import { Generated, Kysely, SqliteDialect } from "kysely";

export type AccessLevel = number & { readonly __brand: unique symbol };
export const AccessLevel = {
  None: 0 as AccessLevel,
  Read: 1 as AccessLevel,
  Write: 2 as AccessLevel,
} as const;

// list tables after those they depend on
const TABLE_NAMES = ["comments", "posts", "users"];

export interface Users {
  id: Generated<number>;
  handle: string;
  name: string;
}

export interface Posts {
  postID: Generated<number>;
  ownerID: number;
  title: string;
}

export interface PostAccessLevels {
  userKey: number;
  resourceKey: number;
  accessLevel: number;
}

export interface Comments {
  commentID: Generated<number>;
  postID: number;
  comment: string;
}

export interface Database {
  users: Users;
  posts: Posts;
  posts_access_levels: PostAccessLevels;
  comments: Comments;
}

export async function createTables(db: Kysely<Database>) {
  await db.schema
    .createTable("users")
    .addColumn("id", "integer", (col) => col.autoIncrement().primaryKey())
    .addColumn("handle", "varchar(255)", (col) => col.notNull())
    .addColumn("name", "varchar(255)", (col) => col.notNull())
    .execute();

  await db.schema
    .createTable("posts")
    .addColumn("postID", "integer", (col) => col.autoIncrement().primaryKey())
    .addColumn("ownerID", "integer", (col) =>
      col.references("users.id").onDelete("cascade").notNull()
    )
    .addColumn("title", "varchar(255)", (col) => col.unique().notNull())
    .execute();

  await db.schema
    .createTable("comments")
    .addColumn("commentID", "integer", (col) =>
      col.autoIncrement().primaryKey()
    )
    .addColumn("postID", "integer", (col) =>
      col.references("posts.postID").onDelete("cascade").notNull()
    )
    .addColumn("comment", "text", (col) => col.notNull())
    .execute();

  return db;
}

export async function dropTables(db: Kysely<Database>): Promise<void> {
  for (const table of TABLE_NAMES) {
    await db.schema.dropTable(table).ifExists().execute();
  }
}

export async function createDB() {
  const db = new Kysely<Database>({
    dialect: new SqliteDialect({
      database: new Sqlite3(":memory:"),
    }),
  });
  await createTables(db);
  return db;
}

export async function destroyDB<DB>(db: Kysely<DB>) {
  return db.destroy();
}

export function ignore(_description: string, _: () => void) {}
