/**
 * Module that populates and validates a Postgres database configuration from
 * environment variables and provides friendly error messages. Implements both
 * pg's `ClientConfig` and `PoolConfig` interfaces, which overlap.
 */

import type { ClientConfig, PoolConfig } from "pg";
import { StandardValidator, ValidationException } from "typebox-validators";

import { Type } from "@sinclair/typebox";
import {
  CodeWordString,
  HostNameString,
  IntegerString,
  NonEmptyString,
} from "@fieldzoo/typebox-types";

import { InvalidEnvironmentException } from "./invalid-env-exception.js";

/**
 * Configuration governing database access, conforming to the
 * client configuration required by the Postgres `pg` package.
 */
export class PostgresConfig implements ClientConfig, PoolConfig {
  readonly host: string;
  readonly port: number;
  readonly database: string;
  readonly user: string;
  readonly password: string;
  readonly max?: number;

  static schema = Type.Object({
    POSTGRES_HOST: HostNameString({
      description: "Host of database server (e.g. 'localhost')",
      errorMessage: "Invalid host name",
    }),
    POSTGRES_PORT: IntegerString({
      description: "Port number of database server at host",
      minimum: 0,
      maximum: 65535,
      errorMessage: "Port must be an integer >= 0 and <= 65535",
    }),

    POSTGRES_DATABASE: CodeWordString({
      description: "Name of database on database server",
      errorMessage: "Invalid database name",
    }),
    POSTGRES_USER: CodeWordString({
      description: "User name with which to login to database",
      errorMessage: "Invalid user",
    }),
    POSTGRES_PASSWORD: NonEmptyString({
      description: "Password for the indicated user",
      errorMessage: "Password should not be empty",
    }),
    POSTGRES_MAX_CONNECTIONS: Type.Optional(
      IntegerString({
        description: "Maximum number of connections to the database (optional)",
        minimum: 1,
        errorMessage: "Max connections must be an integer >= 1",
      })
    ),
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
      POSTGRES_MAX_CONNECTIONS: process.env.POSTGRES_MAX_CONNECTIONS,
    };

    const validator = new StandardValidator(PostgresConfig.schema);
    try {
      validator.validate(values);
    } catch (e: any) {
      if (!(e instanceof ValidationException)) throw e;
      throw InvalidEnvironmentException.fromTypeBoxErrors(e.details);
    }

    this.host = values.POSTGRES_HOST;
    this.port = values.POSTGRES_PORT
      ? parseInt(values.POSTGRES_PORT)
      : (undefined as any);
    this.database = values.POSTGRES_DATABASE;
    this.user = values.POSTGRES_USER;
    this.password = values.POSTGRES_PASSWORD;
    if (values.POSTGRES_MAX_CONNECTIONS) {
      this.max = parseInt(values.POSTGRES_MAX_CONNECTIONS);
    }
  }

  /**
   * Returns a connection string URL for connecting to the database.
   * @returns A connection string URL for connecting to the database.
   */
  getConnectionUrl(): string {
    return `postgres://${encodeURI(this.user)}:${encodeURI(
      this.password
    )}@${encodeURI(this.host)}:${this.port}/${encodeURI(this.database)}`;
  }

  /**
   * Returns help information for the expected environment variables.
   *
   * @returns An object mapping environment variable names to text that
   *  can be used to describe the environment variables in help output.
   */
  static getHelpInfo(): [string, string][] {
    return Object.entries(this.schema.properties)
      .map(([key, value]) => [key, value.description])
      .filter(([_key, value]) => !!value) as [string, string][];
  }
}
