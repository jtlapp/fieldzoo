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

import { DatabaseConfig, DB_ENVVAR_PREFIX, TEST_ENV } from "@fieldzoo/config";
import { dropAllTables } from "@fieldzoo/utilities";

import { MIGRATION_FILE_PATH } from "./migration-utils";

export async function resetTestDB(): Promise<void> {
  // Open the database using the test environment.

  dotenv.config({ path: path.join(process.cwd(), TEST_ENV) });
  const db = new Kysely<any>({
    dialect: new PostgresDialect({
      pool: new Pool(DatabaseConfig.fromEnv(DB_ENVVAR_PREFIX)),
    }),
  });

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
