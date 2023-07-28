/**
 * Utilities for running tests against a test database.
 */

import * as path from "path";
import pg from "pg";
const { Pool } = pg;
import { promises as fs } from "fs";
import * as dotenv from "dotenv";
import {
  Kysely,
  Migrator,
  FileMigrationProvider,
  PostgresDialect,
} from "kysely";
import { fileURLToPath } from "url";

import { MIGRATIONS_PATH, TEST_ENV } from "@fieldzoo/app-config";
import { PostgresConfig } from "@fieldzoo/env-config";
import { clearDatabase } from "@fieldzoo/postgres-utils";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PATH_TO_ROOT = path.join(__dirname, "../../../..");

let db: Kysely<any> | null = null;
let pool: InstanceType<typeof Pool> | null = null;

export function getTestDB(): Kysely<any> {
  if (!db) {
    dotenv.config({ path: path.join(PATH_TO_ROOT, TEST_ENV) });
    pool = new Pool(new PostgresConfig());
    db = new Kysely<any>({ dialect: new PostgresDialect({ pool }) });
  }
  return db;
}

export async function closeTestDB(): Promise<void> {
  if (db) await db.destroy();
  db = null;
  pool = null;
}

export async function resetTestDB(): Promise<void> {
  // Drop any tables already present in the database.

  const db = getTestDB();
  await clearDatabase(db);

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
