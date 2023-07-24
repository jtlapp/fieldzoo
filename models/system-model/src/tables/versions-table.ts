import { CreateTableBuilder, Kysely } from "kysely";

import { CollaborativeColumns } from "../tables/collaborative-table";

/**
 * Utility class for creating version tables. Not based on
 * `TimestampedTable` because it holds archived copies of rows
 * from `TimestampedTable`-based tables. For example, `modifiedAt`
 * does not update on trigger because the table does not update.
 */
export class VersionsTable {
  static async create(
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
        .addColumn("modifiedBy", "text", (col) =>
          col.references("users.id").notNull()
        )
        .addColumn("versionNumber", "integer", (col) => col.notNull())
        .addColumn("whatChangedLine", "text", (col) => col.notNull())
    ).execute();
  }
}
