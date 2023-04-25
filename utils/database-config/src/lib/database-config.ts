/**
 * Module validating and encapsulating a database configuration, capable of
 * creating the configuration from environment variables. It is designed to
 * provide intelligible errors to users who may not be very technical, since
 * non-technical users may attempt to install and run the platform.
 */

import { Type } from "@sinclair/typebox";
import type { ClientConfig } from "pg";

import type { FieldsOf } from "@fieldzoo/generic-types";
import {
  MultitierValidator,
  ValidationException,
} from "@fieldzoo/multitier-validator";
import {
  CodeWordString,
  HostNameString,
  NonEmptyString,
} from "@fieldzoo/typebox-types";

import { InvalidEnvironmentError } from "./invalid-env-error";

const HOST_SUFFIX = "HOST";
const PORT_SUFFIX = "PORT";
const DATABASE_SUFFIX = "DATABASE";
const USER_SUFFIX = "USERNAME";
const PASSWORD_SUFFIX = "PASSWORD";

/**
 * Configuration governing database access, validated on construction.
 */
export class DatabaseConfig implements ClientConfig {
  readonly host: string;
  readonly port: number;
  readonly database: string;
  readonly user: string;
  readonly password: string;

  static schema = Type.Object({
    host: HostNameString({ message: "invalid host name" }),
    port: Type.Integer({
      minimum: 0,
      maximum: 65535,
      message: "port must be an integer >= 0 and <= 65535",
    }),
    database: CodeWordString({ message: "invalid database name" }),
    user: CodeWordString({ message: "invalid user" }),
    password: NonEmptyString({ message: "password should not be empty" }),
  });
  static #validator = new MultitierValidator(this.schema);

  constructor(fields: FieldsOf<DatabaseConfig>) {
    this.host = fields.host;
    this.port = fields.port;
    this.database = fields.database;
    this.user = fields.user;
    this.password = fields.password;
    DatabaseConfig.#validator.unsafeValidate(
      this,
      "Invalid database configuration"
    );
  }

  /**
   * Construct the database configuration from environment variables.
   *
   * @param variablePrefix Prefix starting each environment variable name
   * @returns A database configuration
   * @throws InvalidEnvironmentError when the environment variables don't
   *    specify a valid database configuration
   */
  static fromEnv(variablePrefix: string): DatabaseConfig {
    const hostEnvVar = variablePrefix + HOST_SUFFIX;
    const portEnvVar = variablePrefix + PORT_SUFFIX;
    const databaseEnvVar = variablePrefix + DATABASE_SUFFIX;
    const usernameEnvVar = variablePrefix + USER_SUFFIX;
    const passwordEnvVar = variablePrefix + PASSWORD_SUFFIX;

    try {
      let portString = process.env[portEnvVar];
      if (!portString || portString.match(/^[0-9]+$/) === null) {
        portString = "-1"; // make invalid to keep collecting errors
      }
      return new DatabaseConfig({
        host: process.env[hostEnvVar]!,
        port: parseInt(portString),
        database: process.env[databaseEnvVar]!,
        user: process.env[usernameEnvVar]!,
        password: process.env[passwordEnvVar]!,
      });
    } catch (err: any) {
      if (!(err instanceof ValidationException)) throw err;

      const fieldToEnvVarMap: Record<string, string> = {
        host: hostEnvVar,
        port: portEnvVar,
        database: databaseEnvVar,
        user: usernameEnvVar,
        password: passwordEnvVar,
      };

      const envError = new InvalidEnvironmentError();
      for (const detail of err.details) {
        envError.add({
          envVarName: fieldToEnvVarMap[detail.error.path.substring(1)],
          errorMessage: detail.toString(),
        });
      }
      throw envError;
    }
  }

  /**
   * Returns help information for the expected environment variables.
   *
   * @param variablePrefix Prefix starting each environment variable name
   * @returns An object mapping environment variable names to text that
   *    can be used to describe the environment variables in help output.
   */
  static getHelpInfo(variablePrefix: string): Record<string, string> {
    return {
      [variablePrefix + HOST_SUFFIX]:
        "host of database server (e.g. 'localhost')",
      [variablePrefix + PORT_SUFFIX]: "port number of database server at host",
      [variablePrefix + DATABASE_SUFFIX]: "name of database on database server",
      [variablePrefix + USER_SUFFIX]:
        "user name with which to login to database",
      [variablePrefix + PASSWORD_SUFFIX]: "password for this user",
    };
  }
}
