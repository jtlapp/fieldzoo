/**
 * Module that populates and validates a Postgres database configuration from
 * environment variables and providing friendly error messages. Implements
 * pg's `PoolConfig` interface because Kysely only uses `pg`'s `Pool` class.
 */

import type { PoolConfig } from "pg";
import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

import {
  CodeWordString,
  IntegerString,
  NonEmptyString,
} from "@fieldzoo/typebox-types";

import { InvalidEnvironmentException } from "./invalid-env-exception";

/**
 * Configuration governing database access, conforming to the
 * client configuration required by the Postgres `pg` package.
 */
export class SupabaseConfig implements PoolConfig {
  readonly connectionString: string;
  readonly database: string;
  readonly user: string;
  readonly password: string;
  readonly max: number;

  static schema = Type.Object({
    SUPABASE_URL: Type.String({
      description: "URL of the Supabase server",
      minLength: 1,
      message: "invalid Supabase server URL",
    }),
    SUPABASE_DATABASE: CodeWordString({
      description: "name of database on Supabase server",
      message: "invalid database name",
    }),
    SUPABASE_USER: CodeWordString({
      description: "user name with which to login to database",
      message: "invalid user",
    }),
    SUPABASE_PASSWORD: NonEmptyString({
      description: "password for the indicated user",
      message: "password should not be empty",
    }),
    SUPABASE_MAX_CONNECTIONS: IntegerString({
      description: "maximum number of connections to the database",
      minimum: 1,
      message: "max connections must be an integer >= 1",
    }),
  });

  /**
   * Constructs the database configuration from environment variables.
   */
  constructor() {
    const values = {
      SUPABASE_URL: process.env.SUPABASE_URL!,
      SUPABASE_DATABASE: process.env.SUPABASE_DATABASE!,
      SUPABASE_USER: process.env.SUPABASE_USER!,
      SUPABASE_PASSWORD: process.env.SUPABASE_PASSWORD!,
      SUPABASE_MAX_CONNECTIONS: process.env.SUPABASE_MAX_CONNECTIONS!,
    };

    if (!Value.Check(SupabaseConfig.schema, values)) {
      throw InvalidEnvironmentException.fromTypeBoxErrors(
        Value.Errors(SupabaseConfig.schema, values)
      );
    }

    this.connectionString = values.SUPABASE_URL;
    this.database = values.SUPABASE_DATABASE;
    this.user = values.SUPABASE_USER;
    this.password = values.SUPABASE_PASSWORD;
    this.max = parseInt(values.SUPABASE_MAX_CONNECTIONS);
  }

  /**
   * Returns help information for the expected environment variables.
   *
   * @returns An object mapping environment variable names to text that
   *  can be used to describe the environment variables in help output.
   */
  static getHelpInfo(): [string, string][] {
    return Object.entries(this.schema.properties).map(([key, value]) => [
      key,
      value.description!,
    ]);
  }
}
