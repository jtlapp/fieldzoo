/**
 * Migration utility constants and functions
 */

import * as path from "path";
import { CreateTableBuilder, Kysely } from "kysely";
import { CollaborativeColumns } from "../tables/collaborative-table";

/**
 * Returns the path to the migration files.
 */
export const MIGRATION_FILE_PATH = path.join(__dirname, "../migrations");

export async function createVersionsTable(
  db: Kysely<any>,
  tableName: string,
  factory: (
    tb: CreateTableBuilder<string, CollaborativeColumns>
  ) => CreateTableBuilder<string, any>
) {
  await factory(
    db.schema
      .createTable(tableName)
      .addColumn("createdAt", "timestamp", (col) => col.notNull())
      .addColumn("modifiedAt", "timestamp", (col) => col.notNull())
      .addColumn("modifiedBy", "uuid", (col) =>
        col.references("user_profiles.id").notNull()
      )
      .addColumn("versionNumber", "integer", (col) => col.notNull())
      .addColumn("whatChangedLine", "text", (col) => col.notNull())
  ).execute();
}
