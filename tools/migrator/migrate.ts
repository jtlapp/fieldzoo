import * as path from "path";
import { promises as fs } from "fs";
import { Pool } from "pg";

const MIGRATIONS_FOLDER = "../../libs/migrations";

import {
  Kysely,
  Migrator,
  PostgresDialect,
  FileMigrationProvider,
} from "kysely";
import { run } from "kysely-migration-cli";

const db = new Kysely<any>({
  dialect: new PostgresDialect({
    pool: new Pool({
      host: "localhost",
      database: "kysely_test",
    }),
  }),
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
