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
export function dropAllTables(db: Kysely<Schema>) {
  return sql`select 'drop table if exists "' || tablename || '" cascade;' 
      from pg_tables where schemaname = 'public';`.execute(db);
}

/**
 * Returns the names of all tables in the current database.
 */
export function existingTables(db: Kysely<Schema>) {
  return db
    .selectFrom("pg_tables")
    .select("tablename")
    .where("schemaname", "=", "public")
    .execute();
}
