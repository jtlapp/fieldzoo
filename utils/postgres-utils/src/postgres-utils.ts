import { type Kysely, sql } from "kysely";

interface PgTables {
  schemaname: string;
  tablename: string;
}

interface Schema {
  pg_tables: PgTables;
}

/**
 * Drops all tables in the current database.
 */
export async function dropAllTables(db: Kysely<Schema>): Promise<void> {
  const tableNames = await existingTables(db);
  if (tableNames.length > 0) {
    // It is necessary to quote the table name to keep Postgres from
    // lowercasing it, in case the name contains uppercase letters.
    const dropSql = `${tableNames
      .map((tableName) => `drop table if exists "${tableName}" cascade;`)
      .join("\n")}`;
    await sql.raw(dropSql).execute(db);
  }
}

/**
 * Returns the names of all tables in the current database.
 */
export async function existingTables(db: Kysely<Schema>): Promise<string[]> {
  const rows = await db
    .selectFrom("pg_tables")
    .select("tablename")
    .where("schemaname", "=", "public")
    .execute();
  return rows.map((row) => row.tablename);
}
