/**
 * Module validating and encapsulating a database configuration, capable of
 * creating the configuration from environment variables. It is designed to
 * provide intelligible errors to users who may not be very technical, since
 * non-technical users may attempt to install and run the platform.
 */

import { IsInt, IsString, IsNotEmpty, Matches } from "class-validator";

import {
  FieldsOf,
  ValidatingObject,
  CODE_WORD_REGEX,
  HOST_NAME_REGEX,
  ValidationError,
} from "@fieldzoo/utilities";
import { InRange } from "@fieldzoo/validators";

import { InvalidEnvironmentError } from "../util/invalid-env-error";

/**
 * Configuration governing database access, validated on construction.
 */
export class DatabaseConfig extends ValidatingObject {
  @Matches(HOST_NAME_REGEX, { message: "invalid host name" })
  readonly host: string;

  @IsInt()
  @InRange(0, 65535)
  readonly port: number;

  @Matches(CODE_WORD_REGEX, { message: "invalid database name" })
  readonly database: string;

  @Matches(CODE_WORD_REGEX, { message: "invalid username" })
  readonly username: string;

  @IsString()
  @IsNotEmpty()
  readonly password: string;

  constructor(fields: FieldsOf<DatabaseConfig>) {
    super();
    this.host = fields.host;
    this.port = fields.port;
    this.database = fields.database;
    this.username = fields.username;
    this.password = fields.password;

    this.validate("database configuration");
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
    const hostEnvVar = variablePrefix + "HOST";
    const portEnvVar = variablePrefix + "PORT";
    const databaseEnvVar = variablePrefix + "DATABASE";
    const usernameEnvVar = variablePrefix + "USERNAME";
    const passwordEnvVar = variablePrefix + "PASSWORD";

    try {
      let portString = process.env[portEnvVar];
      if (!portString || portString.match(/^[0-9]+$/) === null) {
        portString = "-1"; // make invalid to keep collecting errors
      }
      return new DatabaseConfig({
        host: process.env[hostEnvVar]!,
        port: parseInt(portString),
        database: process.env[databaseEnvVar]!,
        username: process.env[usernameEnvVar]!,
        password: process.env[passwordEnvVar]!,
      });
    } catch (err: any) {
      if (!(err instanceof ValidationError)) throw err;

      const fieldToEnvVarMap: Record<string, string> = {
        host: hostEnvVar,
        port: portEnvVar,
        database: databaseEnvVar,
        username: usernameEnvVar,
        password: passwordEnvVar,
      };
      const fieldNames = Object.keys(fieldToEnvVarMap);

      const colonOffset = err.message.indexOf(":");
      const error = new InvalidEnvironmentError();
      for (const message of err.message.slice(colonOffset + 2).split("; ")) {
        for (const fieldName of fieldNames) {
          if (message.includes(fieldName)) {
            error.add({
              envVarName: fieldToEnvVarMap[fieldName],
              errorMessage: message,
            });
          }
        }
      }
      throw error;
    }
  }
}
