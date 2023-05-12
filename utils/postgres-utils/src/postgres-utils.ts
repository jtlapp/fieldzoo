import { type Kysely, sql } from "kysely";

interface PgTables {
  schemaname: string;
  tablename: string;
}

interface Schema {
  pg_tables: PgTables;
}

/**
 * Drops everything from the current database.
 */
export async function clearDatabase(db: Kysely<Schema>): Promise<void> {
  const tableNames = await existingTables(db);
  if (tableNames.length > 0) {
    // It is necessary to quote the table name to keep Postgres from
    // lowercasing it, in case the name contains uppercase letters.
    const dropSql = `${tableNames
      .map((tableName) => `drop table if exists "${tableName}" cascade;`)
      .join("\n")}`;
    await sql.raw(dropSql).execute(db);
  }

  const functionNames = await existingFunctions(db);
  if (functionNames.length > 0) {
    const dropSql = `${functionNames
      .map(
        (functionName) => `drop function if exists "${functionName}" cascade;`
      )
      .join("\n")}`;
    await sql.raw(dropSql).execute(db);
  }
}

/**
 * Returns the names of all existing functions in the current database.
 */
export async function existingFunctions(db: Kysely<Schema>): Promise<string[]> {
  const result = await sql
    .raw<{ name: string }>(
      `select routine_name as name from information_schema.routines
        where routine_type = 'FUNCTION' and routine_schema in ('public', 'auth')`
    )
    .execute(db);
  return result.rows.map((row) => row.name);
}

/**
 * Returns the names of all tables in the current database.
 */
export async function existingTables(db: Kysely<Schema>): Promise<string[]> {
  // TODO: rewrite as raw sql to be able to discard types
  const rows = await db
    .selectFrom("pg_tables")
    .select("tablename")
    .where("schemaname", "=", "public")
    .execute();
  return rows.map((row) => row.tablename);
}
