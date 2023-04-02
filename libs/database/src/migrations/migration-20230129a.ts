import { Kysely } from "kysely";

import {
  createTimestampedTable,
  createCollaborativeTable,
} from "../utils/migration-utils";

export async function up(db: Kysely<any>): Promise<void> {
  await createTimestampedTable(db, "users")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("email", "text", (col) => col.notNull())
    .execute();

  await createCollaborativeTable(db, "glossaries")
    .addColumn("uuid", "text", (col) => col.primaryKey())
    .addColumn("ownerId", "integer", (col) =>
      col.references("users.id").onDelete("cascade").notNull()
    )
    .addColumn("name", "text", (col) => col.notNull().unique())
    .addColumn("description", "text")
    .execute();

  await createCollaborativeTable(db, "terms")
    .addColumn("uuid", "text", (col) => col.primaryKey())
    .addColumn("glossaryId", "text", (col) =>
      col.references("glossaries.uuid").onDelete("cascade").notNull()
    )
    .addColumn("name", "text", (col) => col.notNull().unique())
    .addColumn("description", "text", (col) => col.notNull().unique())
    .execute();

  await db.schema
    .createIndex("terms_glossaryId_index")
    .on("terms")
    .column("glossaryId")
    .execute();

  await db.schema
    .createTable("term_terms")
    .addColumn("termId", "text", (col) =>
      col.references("terms.uuid").onDelete("cascade").notNull()
    )
    .addColumn("referencedTermId", "text", (col) =>
      col.references("terms.uuid").onDelete("cascade").notNull()
    )
    .execute();

  await db.schema
    .createIndex("term_terms_termId_index")
    .on("term_terms")
    .column("termId")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("users").execute();
  await db.schema.dropTable("glossaries").execute();
  await db.schema.dropTable("terms").execute();
}
