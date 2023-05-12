/**
 * Utilities for running tests against a test database.
 */

import * as crypto from "crypto";
import * as path from "path";
import { Pool } from "pg";
import { promises as fs } from "fs";
import * as dotenv from "dotenv";
import {
  Kysely,
  Migrator,
  PostgresDialect,
  FileMigrationProvider,
  sql,
} from "kysely";

import { TEST_ENV } from "@fieldzoo/app-config";
import { SupabaseConfig } from "@fieldzoo/env-config";
import { clearDatabase } from "@fieldzoo/postgres-utils";

import { MIGRATION_FILE_PATH } from "./migration-utils";

const PATH_TO_ROOT = path.join(__dirname, "../../../..");

let db: Kysely<any> | null = null;
let pool: Pool | null = null;

export function getTestDB(): Kysely<any> {
  if (!db) {
    dotenv.config({ path: path.join(PATH_TO_ROOT, TEST_ENV) });
    pool = new Pool(new SupabaseConfig());
    db = new Kysely<any>({ dialect: new PostgresDialect({ pool }) });
  }
  return db;
}

export async function closeTestDB(): Promise<void> {
  if (db) await db.destroy();
  db = null;
  pool = null;
}

// TODO: drop db param
export async function resetTestDB(db: Kysely<any>): Promise<void> {
  // Drop any tables already present in the database.

  await clearDatabase(db);
  await sql.raw(`delete from auth.identities`).execute(db);
  await sql.raw(`delete from auth.users`).execute(db);

  // Create all the tables from scratch.

  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: MIGRATION_FILE_PATH,
    }),
  });
  const { error } = await migrator.migrateToLatest();
  if (error) throw error;
}

export async function sleep(millis: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, millis));
}

export async function createSupabaseUser(email: string): Promise<string> {
  const uuid = crypto.randomUUID().toLowerCase();
  const timestamp = new Date();

  await pool!.query(
    `INSERT INTO auth.users (
        id, instance_id,
        email, email_confirmed_at,
        encrypted_password,
        aud, "role",
        raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, last_sign_in_at,
        confirmation_token, email_change, email_change_token_new, recovery_token
      ) VALUES (
        '${uuid}', '00000000-0000-0000-0000-000000000000',
        '${email}', $1,
        '$2a$10$uFKPCIwHTZMrYF2lmfR1TOsJrNxm5rhJ1PQ/NrBwu7YkC2eXBpMZy',
        'authenticated', 'authenticated',
        '{"provider":"email","providers":["email"]}', '{}',
        $1, $1, $1,
        '', '', '', ''
      )`,
    [timestamp]
  );
  await pool!.query(
    `INSERT INTO auth.identities (
        id, user_id,
        "provider",
        identity_data,
        created_at, updated_at, last_sign_in_at
      ) VALUES (
        '${uuid}', '${uuid}',
        'email',
        '{"sub":"${uuid}","email":"${email}"}',
        $1, $1, $1
      )`,
    [timestamp]
  );
  return uuid;
}

export async function updateSupabaseUser(
  uuid: string,
  email: string
): Promise<void> {
  const timestamp = new Date();

  await pool!.query(
    `UPDATE auth.users SET
        email = '${email}',
        updated_at = $1
      WHERE id = $2`,
    [timestamp, uuid]
  );
  await pool!.query(
    `UPDATE auth.identities SET
        identity_data = '{"sub":"${uuid}","email":"${email}"}',
        updated_at = $1
      WHERE id = $2`,
    [timestamp, uuid]
  );
}
