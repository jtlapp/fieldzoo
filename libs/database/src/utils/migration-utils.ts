/**
 * Migration utility constants and functions
 */

import * as path from "path";
import { Kysely, sql } from "kysely";

/**
 * Returns the path to the migration files.
 */
export const MIGRATION_FILE_PATH = path.join(__dirname, "../migrations");

/**
 * Creates a table having `createdAt` and `modifiedAt` timestamps.
 *
 * @param db Reference to the Kysely DB
 * @param tableName Name of the table to create
 * @returns A Kysely table builder
 */
export function createTimestampedTable(db: Kysely<any>, tableName: string) {
  return db.schema
    .createTable(tableName)
    .addColumn("createdAt", "timestamp", (col) =>
      col.defaultTo(sql`now()`).notNull()
    )
    .addColumn("modifiedAt", "timestamp", (col) =>
      col.defaultTo(sql`now()`).notNull()
    );
}

/**
 * Creates a table having `createdAt` and `modifiedAt` timestamps, as well
 * as an `modifiedBy` column indicated the user who last modified the row.
 *
 * @param db Reference to the Kysely DB
 * @param tableName Name of the table to create
 * @returns A Kysely table builder
 */
export function createCollaborativeTable(db: Kysely<any>, tableName: string) {
  return createTimestampedTable(db, tableName).addColumn(
    "modifiedBy",
    "integer",
    (col) => col.references("users.id").onDelete("cascade").notNull()
  );
}
