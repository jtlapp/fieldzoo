/**
 * Table builder functions supporting migration.
 */

import { Kysely, sql } from "kysely";

/**
 * Creates a table having `createdAt` and `updatedAt` timestamps.
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
    .addColumn("updatedAt", "timestamp", (col) =>
      col.defaultTo(sql`now()`).notNull()
    );
}

/**
 * Creates a table having `createdAt` and `updatedAt` timestamps, as well
 * as an `updatedBy` column indicated the user who last updated the row.
 *
 * @param db Reference to the Kysely DB
 * @param tableName Name of the table to create
 * @returns A Kysely table builder
 */
export function createCollaborativeTable(db: Kysely<any>, tableName: string) {
  return createTimestampedTable(db, tableName).addColumn(
    "updatedBy",
    "integer",
    (col) => col.references("users.id").onDelete("cascade").notNull()
  );
}
