/**
 * Module that populates and validates a Postgres database configuration from
 * environment variables and provides friendly error messages. Implements both
 * pg's `ClientConfig` and `PoolConfig` interfaces, which overlap.
 */

import type { ClientConfig, PoolConfig } from "pg";
import {
  HeterogeneousUnionValidator,
  TypeIdentifyingKey,
  ValidationException,
} from "typebox-validators";

import { Type } from "@sinclair/typebox";
import {
  CodeWordString,
  EmptyStringable,
  HostNameString,
  IntegerString,
  NonEmptyString,
} from "@fieldzoo/typebox-types";

import { InvalidEnvironmentException } from "./invalid-env-exception";

/**
 * Configuration governing database access, conforming to the
 * client configuration required by the Postgres `pg` package.
 */
export class PostgresConfig implements ClientConfig, PoolConfig {
  readonly connectionString: string;
  readonly host: string;
  readonly port: number;
  readonly database: string;
  readonly user: string;
  readonly password: string;
  readonly max?: number;

  static baseSchema = Type.Object({
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

  static schema = Type.Union(
    [
      Type.Object({
        POSTGRES_URL: TypeIdentifyingKey(
          Type.String({
            description: "URL of the database server",
            minLength: 1,
            errorMessage: `Invalid database server URL`,
          })
        ),
        POSTGRES_HOST: EmptyStringable(Type.Undefined(), {
          errorMessage: "Cannot be set along with POSTGRES_URL",
        }),
        POSTGRES_PORT: EmptyStringable(Type.Undefined(), {
          errorMessage: "Cannot be set along with POSTGRES_URL",
        }),
        ...PostgresConfig.baseSchema.properties,
      }),
      Type.Object({
        POSTGRES_HOST: TypeIdentifyingKey(
          HostNameString({
            description: "Host of database server (e.g. 'localhost')",
            errorMessage: "Invalid host name",
          })
        ),
        POSTGRES_PORT: IntegerString({
          description: "Port number of database server at host",
          minimum: 0,
          maximum: 65535,
          errorMessage: "Port must be an integer >= 0 and <= 65535",
        }),
        POSTGRES_URL: EmptyStringable(Type.Undefined(), {
          errorMessage: "Cannot be set along with POSTGRES_HOST",
        }),
        ...PostgresConfig.baseSchema.properties,
      }),
    ],
    {
      errorMessage:
        "Must specify either POSTGRES_URL or POSTGRES_HOST/POSTGRES_PORT",
    }
  );

  /**
   * Constructs the database configuration from environment variables.
   */
  constructor() {
    const values = {
      POSTGRES_URL: process.env.POSTGRES_URL!,
      POSTGRES_HOST: process.env.POSTGRES_HOST!,
      POSTGRES_PORT: process.env.POSTGRES_PORT!,
      POSTGRES_DATABASE: process.env.POSTGRES_DATABASE!,
      POSTGRES_USER: process.env.POSTGRES_USER!,
      POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD!,
      POSTGRES_MAX_CONNECTIONS: process.env.POSTGRES_MAX_CONNECTIONS,
    };

    const validator = new HeterogeneousUnionValidator(PostgresConfig.schema);
    try {
      validator.validate(values);
    } catch (e: any) {
      if (!(e instanceof ValidationException)) throw e;
      throw InvalidEnvironmentException.fromTypeBoxErrors(e.details);
    }

    this.connectionString = values.POSTGRES_URL;
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
   * Returns help information for the expected environment variables.
   *
   * @returns An object mapping environment variable names to text that
   *  can be used to describe the environment variables in help output.
   */
  static getHelpInfo(): [string, string][] {
    const properties = [
      ...Object.entries(this.schema.anyOf[0].properties),
      ...Object.entries(this.schema.anyOf[1].properties),
    ];
    const lines = properties
      .map(([key, value]) => [key, value.description])
      .filter(([_key, value]) => !!value) as [string, string][];
    lines.push([
      "*",
      "specify either POSTGRES_URL or POSTGRES_HOST/POSTGRES_PORT",
    ]);
    return lines;
  }
}
