/**
 * Migration utility constants and functions
 */

import * as path from "path";
import { CreateTableBuilder, Kysely, sql } from "kysely";
import { TimestampedColumns, TimestampedTable } from "@fieldzoo/modeling";

/**
 * Returns the path to the migration files.
 */
export const MIGRATION_FILE_PATH = path.join(__dirname, "../migrations");

/**
 * Creates a table having `createdAt` and `modifiedAt` timestamps, as well
 * as an `modifiedBy` column indicated the user who last modified the row.
 *
 * @param db Reference to the Kysely DB
 * @param tableName Name of the table to create
 * @returns A Kysely table builder
 */
export async function createCollaborativeTable(
  db: Kysely<any>,
  tableName: string,
  factory: (
    tb: CreateTableBuilder<string, TimestampedColumns | "modifiedBy">
  ) => CreateTableBuilder<string, any>
) {
  await TimestampedTable.create(db, tableName, (tb) =>
    factory(
      tb.addColumn("modifiedBy", "integer", (col) =>
        col.references("users.id").onDelete("cascade").notNull()
      )
    )
  );
}

export async function createVersionTable(
  db: Kysely<any>,
  tableName: string,
  factory: (
    tb: CreateTableBuilder<
      string,
      TimestampedColumns | "modifiedBy" | "version"
    >
  ) => CreateTableBuilder<string, any>
) {
  await factory(
    db.schema
      .createTable(tableName)
      .addColumn("createdAt", "timestamp", (col) => col.notNull())
      .addColumn("modifiedAt", "timestamp", (col) => col.notNull())
      .addColumn("modifiedBy", "integer", (col) =>
        col.references("users.id").notNull()
      )
      .addColumn("version", "integer", (col) => col.notNull())
  ).execute();
}

/**
 * Creates a function that updates the `version` column of a table,
 * intended to be used as a trigger.
 * @param db Reference to the Kysely DB
 * @returns A promise that adds the function
 */
export function createUpdateVersionFunction(db: Kysely<any>) {
  return sql
    .raw(
      `create or replace function update_version_column()
          returns trigger as $$
        begin
          new."version" = old."version" + 1;
          return new;
        end;
        $$ language 'plpgsql';`
    )
    .execute(db);
}

/**
 * Adds a `version` trigger to the given table.
 * @param db Reference to the Kysely DB
 * @param tableName Name of the table to add the trigger to
 * @returns A promise that adds the trigger
 */
export function addVersionTrigger(db: Kysely<any>, tableName: string) {
  return sql
    .raw(
      `create or replace trigger update_${tableName}_version
          before update on "${tableName}"
          for each row execute procedure update_version_column();`
    )
    .execute(db);
}
