import * as path from "path";
import { promises as fs } from "fs";
import { Pool } from "pg";
import * as dotenv from "dotenv";

import {
  ENVVAR_PREFIX,
  TEST_DB_CONFIG,
  DatabaseConfig,
} from "@fieldzoo/config";

const MIGRATIONS_FOLDER = "../../libs/migrations/src";

import {
  Kysely,
  Migrator,
  PostgresDialect,
  FileMigrationProvider,
} from "kysely";
import { run } from "kysely-migration-cli";

let config = TEST_DB_CONFIG;
if (!process.argv.includes("--test")) {
  dotenv.config();
  config = DatabaseConfig.fromEnv(ENVVAR_PREFIX + "DB_");
}

const db = new Kysely<any>({
  dialect: new PostgresDialect({ pool: new Pool(config) }),
});

const migrator = new Migrator({
  db,
  provider: new FileMigrationProvider({
    fs,
    path,
    migrationFolder: MIGRATIONS_FOLDER,
  }),
});

run(db, migrator);
