import Sqlite3 from "better-sqlite3";
import { Kysely, SqliteDialect, Generated } from "kysely";

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

export async function createDB() {
  return new Kysely<Database>({
    dialect: new SqliteDialect({
      database: new Sqlite3(":memory:"),
    }),
  });
}

export async function createTables(db: Kysely<Database>) {
  await dropTables(db);

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
  for (const table of ["comments", "posts", "users"]) {
    await db.schema.dropTable(table).ifExists().execute();
  }
}

export async function destroyDB<DB>(db: Kysely<DB>) {
  return db.destroy();
}

function _createTableWithId(db: Kysely<Database>, tableName: string) {
  return db.schema
    .createTable(tableName)
    .addColumn("id", "integer", (col) => col.autoIncrement().primaryKey());
}
