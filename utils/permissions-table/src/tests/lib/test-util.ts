import { Kysely, sql, SqliteDialect } from "kysely";
import Sqlite3 from "better-sqlite3";

export type AccessLevel = number & { readonly __brand: unique symbol };
export const AccessLevel = {
  None: 0 as AccessLevel,
  Read: 1 as AccessLevel,
  Write: 2 as AccessLevel,
} as const;

export async function createTables(db: Kysely<any>, keyDataType: string) {
  // TODO: does the user need to specify "serial"? I'd rather that be "integer".
  const refKeyType = keyDataType == "serial" ? "integer" : keyDataType;

  await db.schema
    .createTable("users")
    .addColumn("id", sql.raw(keyDataType), (col) => col.primaryKey())
    .addColumn("handle", "text", (col) => col.notNull())
    .addColumn("name", "text", (col) => col.notNull())
    .execute();

  await db.schema
    .createTable("posts")
    .addColumn("postID", sql.raw(keyDataType), (col) => col.primaryKey())
    .addColumn("ownerID", sql.raw(refKeyType), (col) =>
      col.references("users.id").onDelete("cascade").notNull()
    )
    .addColumn("title", "text", (col) => col.unique().notNull())
    .addColumn("value", "text")
    .execute();

  await db.schema
    .createTable("comments")
    .addColumn("commentID", "serial", (col) => col.primaryKey())
    .addColumn("postID", sql.raw(refKeyType), (col) =>
      col.references("posts.postID").onDelete("cascade").notNull()
    )
    .addColumn("comment", "text", (col) => col.notNull())
    .addColumn("value", "text")
    .execute();

  return db;
}

export async function createDB(keyDataType: string) {
  const testDB = new Kysely<any>({
    dialect: new SqliteDialect({
      database: new Sqlite3(":memory:"),
    }),
  });
  await createTables(testDB, keyDataType);
  return testDB;
}

export async function destroyDB<DB>(db: Kysely<DB>) {
  return db.destroy();
}

export function ignore(_description: string, _: () => void) {}
