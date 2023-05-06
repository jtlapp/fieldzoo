/**
 * Module validating and encapsulating a database configuration, capable of
 * creating the configuration from environment variables. It is designed to
 * provide intelligible errors to users who may not be very technical, since
 * non-technical users may attempt to install and run the platform.
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

import { InvalidEnvironmentError } from "./invalid-env-error";

/**
 * Configuration governing database access, conforming to the
 * client configuration required by the Postgres `pg` package.
 */
export class DatabaseConfig implements ClientConfig {
  readonly host: string;
  readonly port: number;
  readonly database: string;
  readonly user: string;
  readonly password: string;

  static schema = Type.Object({
    POSTGRES_HOST: HostNameString({ message: "invalid host name" }),
    POSTGRES_PORT: IntegerString({
      minimum: 0,
      maximum: 65535,
      message: "port must be an integer >= 0 and <= 65535",
    }),
    POSTGRES_DATABASE: CodeWordString({ message: "invalid database name" }),
    POSTGRES_USER: CodeWordString({ message: "invalid user" }),
    POSTGRES_PASSWORD: NonEmptyString({
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

    if (!Value.Check(DatabaseConfig.schema, values)) {
      throw InvalidEnvironmentError.fromTypeBoxErrors(
        Value.Errors(DatabaseConfig.schema, values)
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
  static getHelpInfo(): Record<string, string> {
    return {
      POSTGRES_HOST: "host of database server (e.g. 'localhost')",
      POSTGRES_PORT: "port number of database server at host",
      POSTGRES_DATABASE: "name of database on database server",
      POSTGRES_USER: "user name with which to login to database",
      POSTGRES_PASSWORD: "password for this user",
    };
  }
}
