// Note: When renaming migration files, it may be necessary to delete the
// nx cache via `pnpm clean`. Not sure why old files are sticking around.

import { Kysely } from "kysely";

import { TimestampedTable } from "@fieldzoo/modeling";

import { createVersionsTable } from "../utils/migration-utils";
import { CollaborativeTable } from "../tables/collaborative-table";

export async function up(db: Kysely<any>): Promise<void> {
  await TimestampedTable.createTriggers(db);
  await CollaborativeTable.createTriggers(db);

  // users table

  await TimestampedTable.create(db, "users", (tb) =>
    tb
      .addColumn("id", "serial", (col) => col.primaryKey())
      .addColumn("name", "text", (col) => col.notNull())
      .addColumn("email", "text", (col) => col.notNull())
  );

  // glossaries table

  await CollaborativeTable.create(db, "glossaries", (tb) =>
    tb
      .addColumn("uuid", "text", (col) => col.primaryKey())
      .addColumn("ownerID", "integer", (col) =>
        col.references("users.id").onDelete("cascade").notNull()
      )
      .addColumn("name", "text", (col) => col.notNull())
      .addColumn("description", "text")
  );

  // glossary versions table

  await createVersionsTable(db, "glossary_versions", (tb) =>
    tb
      .addColumn("uuid", "text", (col) => col.notNull())
      .addColumn("ownerID", "integer", (col) =>
        col.references("users.id").onDelete("cascade").notNull()
      )
      .addColumn("name", "text", (col) => col.notNull())
      .addColumn("description", "text")
      .addUniqueConstraint("uuid_version_key", ["uuid", "version"])
  );

  // terms table

  await CollaborativeTable.create(db, "terms", (tb) =>
    tb
      .addColumn("id", "serial", (col) => col.primaryKey())
      .addColumn("glossaryID", "text", (col) =>
        col.references("glossaries.uuid").onDelete("cascade").notNull()
      )
      .addColumn("lookupName", "text", (col) => col.notNull())
      .addColumn("displayName", "text", (col) => col.notNull())
      .addColumn("description", "text", (col) => col.notNull())
      .addUniqueConstraint("glossaryID_lookupName_key", [
        "glossaryID",
        "lookupName",
      ])
  );

  // term versions table

  await createVersionsTable(db, "term_versions", (tb) =>
    tb
      .addColumn("id", "integer", (col) => col.references("terms.id").notNull())
      // glossaryID need not reference an existing glossary
      .addColumn("glossaryID", "text", (col) => col.notNull())
      .addColumn("displayName", "text", (col) => col.notNull())
      .addColumn("description", "text", (col) => col.notNull())
      .addUniqueConstraint("id_version_key", ["id", "version"])
  );
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("users").execute();
  await db.schema.dropTable("glossaries").execute();
  await db.schema.dropTable("glossary_versions").execute();
  await db.schema.dropTable("terms").execute();
  await db.schema.dropTable("term_versions").execute();
}
