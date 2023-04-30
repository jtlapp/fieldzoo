/**
 * Migration utility constants and functions
 */

import { CreateTableBuilder, Kysely, sql } from "kysely";

/**
 * Creates a function that updates the `modifiedAt` column of a table,
 * intended to be used as a trigger.
 * @param db Reference to the Kysely DB
 * @returns A promise that adds the function
 */
export function createUpdateModifiedAtFunction(db: Kysely<any>) {
  return sql
    .raw(
      `create or replace function update_modifiedAt_column()
          returns trigger as $$
        begin
          new."modifiedAt" = now();
          return new;
        end;
        $$ language 'plpgsql';`
    )
    .execute(db);
}

/**
 * Creates a table having `createdAt` and `modifiedAt` timestamps.
 *
 * @param db Reference to the Kysely DB
 * @param tableName Name of the table to create
 * @returns A Kysely table builder
 */
export async function createTimestampedTable(
  db: Kysely<any>,
  tableName: string,
  factory: (
    tb: CreateTableBuilder<string, "createdAt" | "modifiedAt">
  ) => CreateTableBuilder<string, any>
) {
  factory(
    db.schema
      .createTable(tableName)
      .addColumn("createdAt", "timestamp", (col) =>
        col.defaultTo(sql`now()`).notNull()
      )
      .addColumn("modifiedAt", "timestamp", (col) =>
        col.defaultTo(sql`now()`).notNull()
      )
  ).execute();
  await addModifiedAtTrigger(db, tableName);
}

/**
 * Adds a `modifiedAt` trigger to the given table.
 * @param db Reference to the Kysely DB
 * @param tableName Name of the table to add the trigger to
 * @returns A promise that adds the trigger
 */
export function addModifiedAtTrigger(db: Kysely<any>, tableName: string) {
  return sql
    .raw(
      `create or replace trigger update_${tableName}_modifiedAt
          before update on "${tableName}"
          for each row execute procedure update_modifiedAt_column();`
    )
    .execute(db);
}
