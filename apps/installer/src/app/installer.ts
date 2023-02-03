/**
 * Command line tool for installing or upgrading Field Zoo database tables.
 */

import * as path from "path";
import { Pool } from "pg";
import { promises as fs } from "fs";
import * as dotenv from "dotenv";
import { program } from "commander";
import {
  Kysely,
  Migrator,
  PostgresDialect,
  FileMigrationProvider,
} from "kysely";

import {
  DB_ENVVAR_PREFIX,
  DatabaseConfig,
  InvalidEnvironmentError,
} from "@fieldzoo/config";
import { MIGRATION_FILE_PATH } from "@fieldzoo/database";

import { dropAllTables, existingTables } from "@fieldzoo/utilities";

interface CommandOptions {
  env: string;
}

class CommandFailure extends Error {
  constructor(message: string) {
    super(message);
  }
}

program
  .name("installer")
  .description(
    "Field Zoo Installer. Installs or upgrades the Field Zoo database tables, connecting to the database using the information in the specified .env file."
  )
  .option("--env <path>", "Path to and including the .env file", ".env-admin")
  .addHelpText(
    "after",
    `Environment variables (.env):\n${Object.entries(
      DatabaseConfig.getHelpInfo(DB_ENVVAR_PREFIX)
    )
      .map((entry) => `  ${entry[0]} - ${entry[1]}`)
      .join("\n")}`
  );

program
  .command("install", { isDefault: true })
  .description(
    "Install the database tables from scratch, but only if it doesn't already exist (default command when none given)"
  )
  .action(commandWrapper.bind(doInstall));

program
  .command("reinstall")
  .description(
    "Drop the database tables and then installs them from scratch, if tables already exist in the database"
  )
  .action(commandWrapper.bind(doReinstall));

program
  .command("upgrade")
  .description("Update existing database tables to the latest schema")
  .action(commandWrapper.bind(doUpgrade));

program.parse();

async function commandWrapper(
  action: (db: Kysely<any>) => Promise<void>,
  options: CommandOptions
): Promise<void> {
  let db: Kysely<any> | null = null;
  try {
    try {
      dotenv.config({ path: path.join(process.cwd(), options.env) });
    } catch (err: any) {
      throw new CommandFailure(`File '${options.env}' not found`);
    }
    db = new Kysely<any>({
      dialect: new PostgresDialect({
        pool: new Pool(DatabaseConfig.fromEnv(DB_ENVVAR_PREFIX)),
      }),
    });
    await action(db);
  } catch (err: any) {
    if (err instanceof CommandFailure) {
      console.log(`Failed: ${err.message} (-h for help)`);
    } else if (err instanceof InvalidEnvironmentError) {
      console.log("Failed: " + err.toString());
    } else {
      throw err;
    }
  } finally {
    if (db) await db.destroy();
  }
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
}

async function doReinstall(db: Kysely<any>) {
  const tableNames = await existingTables(db);
  if (tableNames.length == 0) {
    throw new CommandFailure(
      "The database does not contain any tables. Use the 'install' command to install the tables."
    );
  }
  await dropAllTables(db);
  if (!(await migrateToLatestSchema(db))) {
    throw new CommandFailure("Reinstallation failed");
  }
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
}

async function migrateToLatestSchema(db: Kysely<any>): Promise<boolean> {
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: MIGRATION_FILE_PATH,
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
  console.error(error);
  return !!error;
}
