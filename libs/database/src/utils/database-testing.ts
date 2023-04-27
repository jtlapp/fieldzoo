/**
 * Utilities for running tests against a test database.
 */

import * as path from "path";
import { Pool } from "pg";
import { promises as fs } from "fs";
import * as dotenv from "dotenv";
import {
  Kysely,
  Migrator,
  PostgresDialect,
  FileMigrationProvider,
} from "kysely";

import { DB_ENVVAR_PREFIX, TEST_ENV } from "@fieldzoo/app-config";
import { DatabaseConfig } from "@fieldzoo/database-config";
import { dropAllTables } from "@fieldzoo/postgres-utils";

import { MIGRATION_FILE_PATH } from "./migration-utils";

const PATH_TO_ROOT = path.join(__dirname, "../../../..");

let db: Kysely<any> | null = null;

export function getDB(): Kysely<any> {
  if (!db) {
    dotenv.config({ path: path.join(PATH_TO_ROOT, TEST_ENV) });
    db = new Kysely<any>({
      dialect: new PostgresDialect({
        pool: new Pool(DatabaseConfig.fromEnv(DB_ENVVAR_PREFIX)),
      }),
    });
  }
  return db;
}

export async function closeDB(): Promise<void> {
  if (db) await db.destroy();
}

export async function resetTestDB(db: Kysely<any>): Promise<void> {
  // Drop any tables already present in the database.

  await dropAllTables(db);

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
