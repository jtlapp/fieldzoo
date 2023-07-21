/**
 * Utilities for running tests against a test database.
 */

import * as crypto from "crypto";
import * as path from "path";
import pg from "pg";
const { Client } = pg;
import { promises as fs } from "fs";
import * as dotenv from "dotenv";
import { Kysely, Migrator, FileMigrationProvider, sql } from "kysely";
import { PostgresClientDialect } from "kysely-pg-client";
import { fileURLToPath } from "url";

import { MIGRATIONS_PATH, TEST_ENV } from "@fieldzoo/app-config";
import { PostgresConfig } from "@fieldzoo/env-config";
import { clearDatabase } from "@fieldzoo/postgres-utils";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PATH_TO_ROOT = path.join(__dirname, "../../../..");

let db: Kysely<any> | null = null;
let client: InstanceType<typeof Client> | null = null;

export function getTestDB(): Kysely<any> {
  if (!db) {
    dotenv.config({ path: path.join(PATH_TO_ROOT, TEST_ENV) });
    client = new Client(new PostgresConfig());
    db = new Kysely<any>({ dialect: new PostgresClientDialect({ client }) });
  }
  return db;
}

export async function closeTestDB(): Promise<void> {
  if (db) await db.destroy();
  db = null;
  client = null;
}

export async function resetTestDB(): Promise<void> {
  // Drop any tables already present in the database.

  const db = getTestDB();
  await clearDatabase(db);
  await sql.raw(`delete from auth.identities`).execute(db);
  await sql.raw(`delete from auth.users`).execute(db);

  // Create all the tables from scratch.

  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: MIGRATIONS_PATH,
    }),
  });
  const { error } = await migrator.migrateToLatest();
  if (error) throw error;
}

export async function sleep(millis: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, millis));
}

export async function createSupabaseUser(email: string): Promise<string> {
  const userID = crypto.randomUUID().toLowerCase();
  const timestamp = new Date();

  await client!.query(
    `INSERT INTO auth.users (
        id, instance_id,
        email, email_confirmed_at,
        encrypted_password,
        aud, "role",
        raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, last_sign_in_at,
        confirmation_token, email_change, email_change_token_new, recovery_token
      ) VALUES (
        '${userID}', '00000000-0000-0000-0000-000000000000',
        '${email}', $1,
        '$2a$10$uFKPCIwHTZMrYF2lmfR1TOsJrNxm5rhJ1PQ/NrBwu7YkC2eXBpMZy',
        'authenticated', 'authenticated',
        '{"provider":"email","providers":["email"]}', '{}',
        $1, $1, $1,
        '', '', '', ''
      )`,
    [timestamp]
  );
  await client!.query(
    `INSERT INTO auth.identities (
        id, user_id,
        "provider",
        identity_data,
        created_at, updated_at, last_sign_in_at
      ) VALUES (
        '${userID}', '${userID}',
        'email',
        '{"sub":"${userID}","email":"${email}"}',
        $1, $1, $1
      )`,
    [timestamp]
  );
  return userID;
}

export async function updateSupabaseUser(
  userID: string,
  email: string
): Promise<void> {
  const timestamp = new Date();

  await client!.query(
    `UPDATE auth.users SET
        email = '${email}',
        updated_at = $1
      WHERE id = $2`,
    [timestamp, userID]
  );
  await client!.query(
    `UPDATE auth.identities SET
        identity_data = '{"sub":"${userID}","email":"${email}"}',
        updated_at = $1
      WHERE id = $2`,
    [timestamp, userID]
  );
}
