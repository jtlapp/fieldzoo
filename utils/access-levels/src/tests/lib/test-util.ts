import { Kysely, sql, PostgresDialect } from "kysely";
import { Pool } from "pg";
import * as dotenv from "dotenv";
import * as path from "path";

import { PostgresConfig } from "@fieldzoo/env-config";

export type AccessLevel = number & { readonly __brand: unique symbol };
export const AccessLevel = {
  None: 0 as AccessLevel,
  Read: 1 as AccessLevel,
  Write: 2 as AccessLevel,
} as const;

dotenv.config({ path: path.join(__dirname, "../../../../../.env.test") });

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
  try {
    const postgresConfig = new PostgresConfig();
    // TODO: creating the database every time slows down testing
    const postgresDB = new Kysely<any>({
      dialect: new PostgresDialect({ pool: new Pool(postgresConfig) }),
    });
    await sql`drop database if exists accesslevels_test`.execute(postgresDB);
    await sql`create database accesslevels_test`.execute(postgresDB);
    await postgresDB.destroy();

    const testDB = new Kysely<any>({
      dialect: new PostgresDialect({
        pool: new Pool({ ...postgresConfig, database: "accesslevels_test" }),
      }),
    });
    await createTables(testDB, keyDataType);
    return testDB;
  } catch (e: any) {
    // TODO: delete this
    console.log(e);
    throw e;
  }
}

export async function destroyDB<DB>(db: Kysely<DB>) {
  return db.destroy();
}

export function ignore(_description: string, _: () => void) {}
