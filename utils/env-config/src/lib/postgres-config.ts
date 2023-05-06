/**
 * Module that populates and validates a Postgres database configuration from
 * environment variables and providing friendly error messages.
 */

import type { ClientConfig } from "pg";
import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

import {
  CodeWordString,
  HostNameString,
  IntegerString,
  NonEmptyString,
} from "@fieldzoo/typebox-types";

import { InvalidEnvironmentException } from "./invalid-env-exception";

/**
 * Configuration governing database access, conforming to the
 * client configuration required by the Postgres `pg` package.
 */
export class PostgresConfig implements ClientConfig {
  readonly host: string;
  readonly port: number;
  readonly database: string;
  readonly user: string;
  readonly password: string;

  static schema = Type.Object({
    POSTGRES_HOST: HostNameString({
      description: "host of database server (e.g. 'localhost')",
      message: "invalid host name",
    }),
    POSTGRES_PORT: IntegerString({
      description: "port number of database server at host",
      minimum: 0,
      maximum: 65535,
      message: "port must be an integer >= 0 and <= 65535",
    }),
    POSTGRES_DATABASE: CodeWordString({
      description: "name of database on database server",
      message: "invalid database name",
    }),
    POSTGRES_USER: CodeWordString({
      description: "user name with which to login to database",
      message: "invalid user",
    }),
    POSTGRES_PASSWORD: NonEmptyString({
      description: "password for the indicated user",
      message: "password should not be empty",
    }),
  });

  /**
   * Constructs the database configuration from environment variables.
   */
  constructor() {
    const values = {
      POSTGRES_HOST: process.env.POSTGRES_HOST!,
      POSTGRES_PORT: process.env.POSTGRES_PORT!,
      POSTGRES_DATABASE: process.env.POSTGRES_DATABASE!,
      POSTGRES_USER: process.env.POSTGRES_USER!,
      POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD!,
    };

    if (!Value.Check(PostgresConfig.schema, values)) {
      throw InvalidEnvironmentException.fromTypeBoxErrors(
        Value.Errors(PostgresConfig.schema, values)
      );
    }

    this.host = values.POSTGRES_HOST;
    this.port = parseInt(values.POSTGRES_PORT);
    this.database = values.POSTGRES_DATABASE;
    this.user = values.POSTGRES_USER;
    this.password = values.POSTGRES_PASSWORD;
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
