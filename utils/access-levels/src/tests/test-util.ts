import Sqlite3 from "better-sqlite3";
import { ColumnDefinitionBuilder, Kysely, SqliteDialect, sql } from "kysely";

export type AccessLevel = number & { readonly __brand: unique symbol };
export const AccessLevel = {
  None: 0 as AccessLevel,
  Read: 1 as AccessLevel,
  Write: 2 as AccessLevel,
} as const;

// list tables after those they depend on
const TABLE_NAMES = ["comments", "posts", "users"];

export async function createTables(db: Kysely<any>, keyDataType: string) {
  await db.schema
    .createTable("users")
    .addColumn("id", sql.id(keyDataType), (col) =>
      autoIncrement(keyDataType, col).primaryKey()
    )
    .addColumn("handle", "varchar(255)", (col) => col.notNull())
    .addColumn("name", "varchar(255)", (col) => col.notNull())
    .execute();

  await db.schema
    .createTable("posts")
    .addColumn("postID", sql.id(keyDataType), (col) =>
      autoIncrement(keyDataType, col).primaryKey()
    )
    .addColumn("ownerID", sql.id(keyDataType), (col) =>
      col.references("users.id").onDelete("cascade").notNull()
    )
    .addColumn("title", "varchar(255)", (col) => col.unique().notNull())
    .execute();

  await db.schema
    .createTable("comments")
    .addColumn("commentID", "integer", (col) =>
      col.autoIncrement().primaryKey()
    )
    .addColumn("postID", sql.id(keyDataType), (col) =>
      col.references("posts.postID").onDelete("cascade").notNull()
    )
    .addColumn("comment", "text", (col) => col.notNull())
    .execute();

  return db;
}

function autoIncrement<CB extends ColumnDefinitionBuilder>(
  keyDataType: string,
  col: CB
) {
  return keyDataType == "integer" ? col.autoIncrement() : col;
}

export async function dropTables(db: Kysely<any>): Promise<void> {
  for (const table of TABLE_NAMES) {
    await db.schema.dropTable(table).ifExists().execute();
  }
}

export async function createDB(keyDataType: string) {
  const db = new Kysely<any>({
    dialect: new SqliteDialect({
      database: new Sqlite3(":memory:"),
    }),
  });
  await createTables(db, keyDataType);
  return db;
}

export async function destroyDB<DB>(db: Kysely<DB>) {
  return db.destroy();
}

export function ignore(_description: string, _: () => void) {}
