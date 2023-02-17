/**
 * Classes reporting invalid environment variables. Allows errors to accumulate,
 * so that all errors can be reported at once instead of only the first error.
 */

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
export class InvalidEnvironmentError {
  readonly message = "Invalid environment variable(s)";
  errors: EnvironmentVariableError[] = [];

  add(error: EnvironmentVariableError) {
    this.errors.push(error);
  }

  toString(): string {
    return `${this.message}:\n${this.errors
      .map((err) => `  ${err.envVarName}: ${err.errorMessage}`)
      .join("\n")}`;
  }
}
