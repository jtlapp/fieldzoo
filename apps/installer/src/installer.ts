/**
 * Command line tool for installing or upgrading Field Zoo database tables.
 */

import * as path from "path";
import { Client } from "pg";
import { promises as fs } from "fs";
import * as dotenv from "dotenv";
import { program } from "commander";
import { Kysely, Migrator, FileMigrationProvider } from "kysely";
import ExtendableError from "es6-error";
import { PostgresClientDialect } from "kysely-pg-client";

import {
  PostgresConfig,
  InvalidEnvironmentException,
} from "@fieldzoo/env-config";
import { MIGRATIONS_PATH } from "@fieldzoo/app-config";
import { clearDatabase, existingTables } from "@fieldzoo/postgres-utils";

const DEFAULT_ENV_FILE = ".env";
const PATH_TO_ROOT = path.join(__dirname, "../../..");

/** Root-relative path name of .env file having DB credentials */
let envFileName = DEFAULT_ENV_FILE;

class CommandFailure extends ExtendableError {
  constructor(message: string) {
    super(message);
  }
}

program
  .name("installer")
  .description(
    "Field Zoo Installer. Installs or upgrades the Field Zoo database tables, connecting to the database using the information in the specified .env file."
  )
  .option(
    "--env <path>",
    "Path to and including the .env file",
    DEFAULT_ENV_FILE
  )
  .on("option:env", (value) => (envFileName = value))
  .addHelpText(
    "after",
    `\nEnvironment variables (.env):\n${PostgresConfig.getHelpInfo()
      .map(([envVar, description]) => `  ${envVar} - ${description}`)
      .join("\n")}`
  );

program
  .command("install", { isDefault: true })
  .description(
    "Install the database tables from scratch, but only if it doesn't already exist (default command when none given)"
  )
  .action(commandWrapper.bind(null, doInstall));

program
  .command("reinstall")
  .description(
    "Drop the database tables and then installs them from scratch, if tables already exist in the database"
  )
  .action(commandWrapper.bind(null, doReinstall));

program
  .command("upgrade")
  .description("Update existing database tables to the latest schema")
  .action(commandWrapper.bind(null, doUpgrade));

program.parse();

async function commandWrapper(
  action: (db: Kysely<any>) => Promise<void>
): Promise<void> {
  let db: Kysely<any> | null = null;
  let errored = false;
  try {
    try {
      dotenv.config({ path: path.join(PATH_TO_ROOT, envFileName) });
    } catch (err: any) {
      throw new CommandFailure(`File '${envFileName}' not found`);
    }
    db = new Kysely<any>({
      dialect: new PostgresClientDialect({
        client: new Client(new PostgresConfig()),
      }),
    });
    await action(db);
  } catch (err: any) {
    errored = true;
    if (err instanceof CommandFailure) {
      console.error(`FAILED: ${err.message} (-h for help)\n`);
    } else if (err instanceof InvalidEnvironmentException) {
      console.error("FAILED: " + err.toString() + "\n");
    } else {
      throw err;
    }
  } finally {
    if (db) await db.destroy();
  }
  process.exit(errored ? 1 : 0);
}

async function doInstall(db: Kysely<any>) {
  const tableNames = await existingTables(db);
  if (tableNames.length > 0) {
    throw new CommandFailure(
      "The database already contains tables. Use the 'reinstall' command to delete these tables before installing."
    );
  }
  if (!(await migrateToLatestSchema(db))) {
    throw new CommandFailure("Installation failed");
  }
  console.log("Installed.");
}

async function doReinstall(db: Kysely<any>) {
  const tableNames = await existingTables(db);
  if (tableNames.length == 0) {
    throw new CommandFailure(
      "The database does not contain any tables. Use the 'install' command to install the tables."
    );
  }
  await clearDatabase(db);
  if (!(await migrateToLatestSchema(db))) {
    throw new CommandFailure("Reinstallation failed");
  }
  console.log("Reinstalled.");
}

async function doUpgrade(db: Kysely<any>) {
  const tableNames = await existingTables(db);
  if (tableNames.length == 0) {
    throw new CommandFailure(
      "The database does not contain any tables. Use the 'install' command to install the tables."
    );
  }
  if (!(await migrateToLatestSchema(db))) {
    throw new CommandFailure("Upgrade failed");
  }
  console.log("Upgraded.");
}

async function migrateToLatestSchema(db: Kysely<any>): Promise<boolean> {
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: MIGRATIONS_PATH,
    }),
  });

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((result) => {
    console.log(
      `${result.status == "Success" ? "success" : "failed"}: migration ${
        result.migrationName
      }`
    );
  });
  if (error) {
    console.error(error);
  }
  return !error;
}
