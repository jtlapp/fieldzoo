import { Kysely, sql, PostgresDialect } from "kysely";
import pg from "pg";
const { Pool } = pg;
import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";

import { PermissionsTable } from "../../lib/permissions-table";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export type AccessLevel = number & { readonly __brand: unique symbol };
export const AccessLevel = {
  None: 0 as AccessLevel,
  Read: 1 as AccessLevel,
  Write: 2 as AccessLevel,
  Owner: 3 as AccessLevel,
} as const;

dotenv.config({ path: path.join(__dirname, "../../../../../.env.test") });
const postgresConfig = {
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT!),
  database: process.env.POSTGRES_DATABASE,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
};

const tables = [
  "custom_permissions_table",
  "test_comments",
  "test_posts",
  "test_users",
];

export async function createTables(db: Kysely<any>, keyDataType: string) {
  const refKeyType = keyDataType == "serial" ? "integer" : keyDataType;

  await db.schema
    .createTable("test_users")
    .addColumn("id", sql.raw(keyDataType), (col) => col.primaryKey())
    .addColumn("userHandle", "text", (col) => col.notNull())
    .addColumn("displayName", "text", (col) => col.notNull())
    .execute();

  await db.schema
    .createTable("test_posts")
    .addColumn("postID", sql.raw(keyDataType), (col) => col.primaryKey())
    .addColumn("ownerID", sql.raw(refKeyType), (col) =>
      col.references("test_users.id").onDelete("cascade").notNull()
    )
    .addColumn("title", "text", (col) => col.unique().notNull())
    .addColumn("value", "text")
    .execute();

  await db.schema
    .createTable("test_comments")
    .addColumn("commentID", "serial", (col) => col.primaryKey())
    .addColumn("postID", sql.raw(refKeyType), (col) =>
      col.references("test_posts.postID").onDelete("cascade").notNull()
    )
    .addColumn("comment", "text", (col) => col.notNull())
    .addColumn("value", "text")
    .execute();

  return db;
}

async function dropTables(db: Kysely<any>) {
  for (const table of tables) {
    await db.schema.dropTable(table).ifExists().execute();
  }
}

export async function createDatabase() {
  const postgresDB = new Kysely<any>({
    dialect: new PostgresDialect({ pool: new Pool(postgresConfig) }),
  });
  await sql`drop database if exists permissions_test`.execute(postgresDB);
  await sql`create database permissions_test`.execute(postgresDB);
  await postgresDB.destroy();
}

export async function createDB(
  keyDataType: string,
  permissionsTable: PermissionsTable<any, any, any, any, any>
) {
  const testDB = new Kysely<any>({
    dialect: new PostgresDialect({ pool: new Pool(postgresConfig) }),
  });
  await permissionsTable.drop(testDB);
  await dropTables(testDB); // in case database is out of sorts
  await createTables(testDB, keyDataType);
  return testDB;
}

export async function destroyDB<DB>(
  db: Kysely<DB>,
  permissionsTable: PermissionsTable<any, any, any, any, any>
) {
  await permissionsTable.drop(db);
  await dropTables(db);
  return db.destroy();
}

export function ignore(_description: string, _: () => void) {}
