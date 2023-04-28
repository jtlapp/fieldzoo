import { Kysely } from "kysely";

import {
  createTimestampedTable,
  createCollaborativeTable,
  createUpdateModifiedAtFunction,
} from "../utils/migration-utils";

export async function up(db: Kysely<any>): Promise<void> {
  await createUpdateModifiedAtFunction(db);

  // users table

  await createTimestampedTable(db, "users", (tb) =>
    tb
      .addColumn("id", "serial", (col) => col.primaryKey())
      .addColumn("name", "text", (col) => col.notNull())
      .addColumn("email", "text", (col) => col.notNull())
  );

  // glossaries table

  await createCollaborativeTable(db, "glossaries", (tb) =>
    tb
      .addColumn("uuid", "text", (col) => col.primaryKey())
      .addColumn("ownerId", "integer", (col) =>
        col.references("users.id").onDelete("cascade").notNull()
      )
      .addColumn("name", "text", (col) => col.notNull())
      .addColumn("description", "text")
  );

  // terms table

  await createCollaborativeTable(db, "terms", (tb) =>
    tb
      .addColumn("id", "serial", (col) => col.primaryKey())
      .addColumn("glossaryId", "text", (col) =>
        col.references("glossaries.uuid").onDelete("cascade").notNull()
      )
      .addColumn("lookupName", "text", (col) => col.notNull())
      .addColumn("displayName", "text", (col) => col.notNull())
      .addColumn("description", "text", (col) => col.notNull())
      .addUniqueConstraint("glossaryId_lookupName_key", [
        "glossaryId",
        "lookupName",
      ])
  );
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("users").execute();
  await db.schema.dropTable("glossaries").execute();
  await db.schema.dropTable("terms").execute();
}
