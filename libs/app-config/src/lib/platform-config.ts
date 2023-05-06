/**
 * Module that populates and validates the platform configuration.
 */

import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

import { InvalidEnvironmentException } from "@fieldzoo/env-config";

/**
 * General platform configuration.
 */
export class PostgresConfig {
  readonly minPasswordStrength: number;

  static schema = Type.Object({
    MIN_PASSWORD_STRENGTH: Type.Integer({
      description: "logarithm of min. guesses required to crack password",
      minimum: 0,
      message: "must be an integer >= 0",
    }),
  });

  /**
   * Constructs the platform configuration from environment variables.
   */
  constructor() {
    const values = {
      MIN_PASSWORD_STRENGTH: process.env.MIN_PASSWORD_STRENGTH!,
    };

    if (!Value.Check(PostgresConfig.schema, values)) {
      throw InvalidEnvironmentException.fromTypeBoxErrors(
        Value.Errors(PostgresConfig.schema, values)
      );
    }

    this.minPasswordStrength = values.MIN_PASSWORD_STRENGTH;
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
