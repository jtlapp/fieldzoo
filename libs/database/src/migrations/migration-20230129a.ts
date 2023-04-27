import { Kysely } from "kysely";

import {
  createTimestampedTable,
  createCollaborativeTable,
} from "../utils/migration-utils";

export async function up(db: Kysely<any>): Promise<void> {
  // users table

  await createTimestampedTable(db, "users")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("email", "text", (col) => col.notNull())
    .execute();

  // glossaries table

  await createCollaborativeTable(db, "glossaries")
    .addColumn("uuid", "text", (col) => col.primaryKey())
    .addColumn("ownerId", "integer", (col) =>
      col.references("users.id").onDelete("cascade").notNull()
    )
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("description", "text")
    .execute();

  // terms table

  await createCollaborativeTable(db, "terms")
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
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("users").execute();
  await db.schema.dropTable("glossaries").execute();
  await db.schema.dropTable("terms").execute();
}
