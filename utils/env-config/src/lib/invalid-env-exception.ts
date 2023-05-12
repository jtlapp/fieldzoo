/**
 * Classes reporting invalid environment variables. Allows errors to accumulate,
 * so that all errors can be reported at once instead of only the first error.
 * Only reports the first error generated for each environment variable.
 */

import { ValueErrorIterator } from "@sinclair/typebox/errors";

/**
 * Interface representing a single problem with a particular environment variable.
 */
export interface EnvironmentVariableError {
  envVarName: string;
  errorMessage: string;
}

/**
 * Class representing one or more problems with one or more environment variables.
 */
export class InvalidEnvironmentException {
  readonly message = "Invalid environment variable(s)";
  errors: EnvironmentVariableError[] = [];

  add(error: EnvironmentVariableError) {
    if (!this.errors.find((err) => err.envVarName === error.envVarName)) {
      this.errors.push(error);
    }
  }

  toString(): string {
    return `${this.message}:\n${this.errors
      .map((err) => `  ${err.envVarName}: ${err.errorMessage}`)
      .join("\n")}`;
  }

  static fromTypeBoxErrors(
    errors: ValueErrorIterator
  ): InvalidEnvironmentException {
    const envError = new InvalidEnvironmentException();
    for (const error of errors) {
      envError.add({
        envVarName: error.path.substring(1),
        errorMessage: error.schema.message ?? error.message,
      });
    }
    return envError;
  }
}
