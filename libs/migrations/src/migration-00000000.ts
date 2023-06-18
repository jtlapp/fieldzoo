// Note: When renaming migration files, it may be necessary to delete the
// nx cache via `pnpm clean`. Not sure why old files are sticking around.

import { Kysely, sql } from "kysely";

import { TimestampedTable } from "@fieldzoo/modeling";
import { VersionsTable, CollaborativeTable } from "@fieldzoo/system-model";

export async function up(db: Kysely<any>): Promise<void> {
  await TimestampedTable.createFunctions(db);
  await CollaborativeTable.createFunctions(db);

  // user_profiles table

  await TimestampedTable.create(db, "user_profiles", (tb) =>
    tb
      .addColumn("id", "uuid", (col) =>
        col.primaryKey().references("auth.users.id")
      )
      .addColumn("name", "text")
      .addColumn("handle", "text", (col) => col.unique())
  );
  await sql
    .raw(
      `create function public.handle_insert_user()
        returns trigger as $$
        begin
          insert into public.user_profiles (id)
          values (new.id);
          return new;
        end;
        $$ language plpgsql security definer;
        
      create trigger on_auth_user_created
        after insert on auth.users
        for each row execute procedure public.handle_insert_user();`
    )
    .execute(db);

  // glossaries table

  await CollaborativeTable.create(db, "glossaries", (tb) =>
    tb
      .addColumn("id", "text", (col) => col.primaryKey())
      .addColumn("ownerID", "uuid", (col) =>
        col.references("user_profiles.id").onDelete("cascade").notNull()
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
      .addColumn("ownerID", "uuid", (col) =>
        col.references("user_profiles.id").onDelete("cascade").notNull()
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
      .addColumn("userID", "uuid", (col) =>
        col.references("user_profiles.id").onDelete("cascade").notNull()
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
  await db.schema.dropTable("user_profiles").execute();

  await sql
    .raw(`drop function if exists public.handle_insert_user() cascade;`)
    .execute(db);

  await CollaborativeTable.dropFunctions(db);
  await TimestampedTable.dropFunctions(db);
}