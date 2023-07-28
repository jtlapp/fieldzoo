// Note: When renaming migration files, it may be necessary to delete the
// nx cache via `pnpm clean`. Not sure why old files are sticking around.

import { Kysely, sql } from "kysely";

import { TimestampedTable } from "@fieldzoo/general-model";
import { CollaborativeTable, VersionsTable } from "@fieldzoo/system-model";

export async function up(db: Kysely<any>): Promise<void> {
  await TimestampedTable.createFunctions(db);
  await CollaborativeTable.createFunctions(db);

  // install required extensions

  await sql.raw(`create extension if not exists citext`).execute(db);

  // users table

  await TimestampedTable.create(db, "users", (tb) =>
    tb
      .addColumn("id", "text", (col) => col.primaryKey())
      .addColumn("email", sql`citext`, (col) => col.unique().notNull())
      .addColumn("name", "text")
      .addColumn("userHandle", sql`citext`, (col) => col.unique())
      .addColumn("lastLoginAt", "timestamp")
      .addColumn("disabledAt", "timestamp")
  );

  // user keys table (dictated by Lucia)

  await db.schema
    .createTable("user_keys")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("user_id", "text", (col) =>
      col.references("users.id").notNull().onDelete("cascade")
    )
    .addColumn("hashed_password", "text")
    .execute();

  // user sessions table (dictated by Lucia)

  await db.schema
    .createTable("user_sessions")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("user_id", "text", (col) =>
      col.references("users.id").notNull().onDelete("cascade")
    )
    .addColumn("active_expires", "bigint", (col) => col.notNull())
    .addColumn("idle_expires", "bigint", (col) => col.notNull())
    .execute();

  // glossaries table

  await CollaborativeTable.create(db, "glossaries", (tb) =>
    tb
      .addColumn("id", "text", (col) => col.primaryKey())
      .addColumn("ownerID", "text", (col) =>
        col.references("users.id").onDelete("cascade").notNull()
      )
      .addColumn("name", "text", (col) => col.notNull())
      .addColumn("description", "text")
  );

  // glossary versions table

  await VersionsTable.create(db, "glossary_versions", (tb) =>
    tb
      .addColumn("glossaryID", "text", (col) =>
        col.references("glossaries.id").notNull()
      )
      .addColumn("ownerID", "text", (col) =>
        col.references("users.id").onDelete("cascade").notNull()
      )
      .addColumn("name", "text", (col) => col.notNull())
      .addColumn("description", "text")
      .addUniqueConstraint("glossaryID_versionNumber_key", [
        "glossaryID",
        "versionNumber",
      ])
  );

  // glossaries_permissions table

  await TimestampedTable.create(db, "user_glossary_permissions", (tb) =>
    tb
      .addColumn("userID", "text", (col) =>
        col.references("users.id").onDelete("cascade").notNull()
      )
      .addColumn("glossaryID", "text", (col) =>
        col.references("glossaries.id").onDelete("cascade").notNull()
      )
      .addColumn("permissions", "integer", (col) => col.notNull())
      .addUniqueConstraint("userID_glossaryID_key", ["userID", "glossaryID"])
  );

  // terms table

  await CollaborativeTable.create(db, "terms", (tb) =>
    tb
      .addColumn("id", "serial", (col) => col.primaryKey())
      .addColumn("glossaryID", "text", (col) =>
        col.references("glossaries.id").onDelete("cascade").notNull()
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

  await VersionsTable.create(db, "term_versions", (tb) =>
    tb
      .addColumn("termID", "integer", (col) =>
        col.references("terms.id").notNull()
      )
      // glossaryID need not reference an existing glossary
      .addColumn("glossaryID", "text", (col) => col.notNull())
      .addColumn("displayName", "text", (col) => col.notNull())
      .addColumn("description", "text", (col) => col.notNull())
      .addUniqueConstraint("termID_versionNumber_key", [
        "termID",
        "versionNumber",
      ])
  );
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("term_versions").execute();
  await db.schema.dropTable("terms").execute();
  await db.schema.dropTable("user_glossary_permissions").execute();
  await db.schema.dropTable("glossary_versions").execute();
  await db.schema.dropTable("glossaries").execute();
  await db.schema.dropTable("user_sessions").execute();
  await db.schema.dropTable("user_keys").execute();
  await db.schema.dropTable("users").execute();

  await sql
    .raw(`drop function if exists public.handle_insert_user() cascade;`)
    .execute(db);

  await CollaborativeTable.dropFunctions(db);
  await TimestampedTable.dropFunctions(db);
}
