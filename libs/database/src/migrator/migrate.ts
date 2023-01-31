import * as path from "path";
import { promises as fs } from "fs";
import { Pool } from "pg";
import * as dotenv from "dotenv";

import {
  ENVVAR_PREFIX,
  TEST_DB_CONFIG,
  DatabaseConfig,
} from "@fieldzoo/config";

const MIGRATIONS_FOLDER = "../libs/migrations";
//const HELP_SWITCHES = ["-h", "--help"];
const TEST_SWITCH = "--test";

import {
  Kysely,
  Migrator,
  PostgresDialect,
  FileMigrationProvider,
} from "kysely";
import { run } from "kysely-migration-cli";

let config = TEST_DB_CONFIG;
if (!process.argv.includes(TEST_SWITCH)) {
  try {
    dotenv.config();
  } catch (_err: any) {
    console.log("Please create a .env file or use the --test switch.");
    process.exit(1);
  }
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
