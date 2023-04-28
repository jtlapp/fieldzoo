/**
 * Migration utility constants and functions
 */

import * as path from "path";
import { CreateTableBuilder, Kysely } from "kysely";
import { createTimestampedTable } from "@fieldzoo/modeling";

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
    tb: CreateTableBuilder<string, "createdAt" | "modifiedAt" | "modifiedBy">
  ) => CreateTableBuilder<string, any>
) {
  await createTimestampedTable(db, tableName, (tb) =>
    factory(
      tb.addColumn("modifiedBy", "integer", (col) =>
        col.references("users.id").onDelete("cascade").notNull()
      )
    )
  );
}
