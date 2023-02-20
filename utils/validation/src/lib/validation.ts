/**
 * Tools supporting data and object validation with `@sinclair/typebox`.
 */

import { TypeCompiler, type ValueError } from "@sinclair/typebox/compiler";
import ExtendableError from "es6-error";

/**
 * Makes an object key readonly at runtime.
 *
 * @param obj Object containing field to freeze.
 * @param field Name of the field to make read only.
 */
export function freezeField(obj: object, field: string): void {
  Object.defineProperty(obj, field, {
    configurable: false,
    writable: false,
  });
}

/**
 * Validates a value against its compiled TypeBox schema,
 * throwing `ValidationError` on failure to validate.
 *
 * @param checker The compiled TypeBox schema against which to validate the value.
 * @param value Value to validate.
 * @param messageOrFunc Message to provide with error, in addition to any per-field
 *    error messages, excluding those of nested fields; may be a function that
 *    returns a string, in order to lazily construct the message as needed. Set to
 *    null to use the default error messages.
 * @throws ValidationError when the value is invalid
 */
export function validate(
  checker: ReturnType<typeof TypeCompiler.Compile>,
  value: unknown,
  errorMessageOrFunc: string | (() => string) | null = null,
): void {
  const errors = [...checker.Errors(value)];
  if (errors.length > 0) {
    throw new ValidationError(
      typeof errorMessageOrFunc == "function"
        ? errorMessageOrFunc()
        : errorMessageOrFunc,
      errors,
    );
  }
}

/**
 * Class reporting a validation error.
 */
export class ValidationError extends ExtendableError {
  /**
   * Constructs a ValidationError.
   *
   * @param message Error message
   */
  constructor(message: string | null, public errors: ValueError[]) {
    super(message || "Invalid value");
  }

  /**
   * Returns a string representation of the error.
   *
   * @param appendFieldErrors Whether to append per-field error messages.
   */
  toString(appendFieldErrors = true): string {
    let fieldMessages: string[] = [];
    if (!appendFieldErrors) {
      return this.message;
    }
    fieldMessages = this.errors.flatMap((err) => {
      if (err.schema.message) {
        const path = err.path ? err.path.substring(1) : "";
        return err.schema.message.replace("<>", path);
      }
      if (err.path) {
        const firstChar = err.message.substring(0, 1).toLowerCase();
        const remainder = err.message.substring(1);
        return `${err.path.substring(1)} - ${firstChar}${remainder}`;
      }
      return err.message;
    });
    return `${this.message}: ${fieldMessages.join("; ")}`;
  }
}
