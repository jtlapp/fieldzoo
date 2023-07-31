import pg from "pg";
const { Pool } = pg;
import { Kysely, PostgresDialect } from "kysely";

import { PostgresConfig } from "@fieldzoo/env-config";
import {
  type Database,
  EmailVerificationRepo,
  UserRepo,
} from "@fieldzoo/system-model";

export class DatabaseRepos {
  // Lucia sessions always requires a connection pool, so always create it.
  connectionPool: InstanceType<typeof Pool>;

  #kyselyDB: Kysely<Database> | null = null;
  #emailVerificationRepo: EmailVerificationRepo | null = null;
  #userRepo: UserRepo | null = null;

  constructor() {
    // TODO: need to call pool.end() somewhere
    this.connectionPool = new Pool(new PostgresConfig());
  }

  get kyselyDB() {
    if (this.#kyselyDB === null) {
      this.#kyselyDB = new Kysely<Database>({
        dialect: new PostgresDialect({ pool: this.connectionPool }),
      });
    }
    return this.#kyselyDB;
  }

  get emailVerificationRepo() {
    if (this.#emailVerificationRepo === null) {
      this.#emailVerificationRepo = new EmailVerificationRepo(this.kyselyDB);
    }
    return this.#emailVerificationRepo;
  }

  get userRepo() {
    if (this.#userRepo === null) {
      this.#userRepo = new UserRepo(this.kyselyDB);
    }
    return this.#userRepo;
  }
}
