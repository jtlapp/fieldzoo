/**
 * Tools supporting data and object validation. Relies on the
 * `class-validator` package for validating object fields.
 */

import { validateSync } from "class-validator";

import { ClassType } from "./generic-types";

/**
 * Base class with convenience methods for validating objects.
 */
export abstract class ValidatingObject {
  /**
   * Make an object field readonly during runtime.
   *
   * @param field Name of the field to make read only.
   */
  protected freezeField(field: string): void {
    Object.defineProperty(this, field, {
      configurable: false,
      writable: false,
    });
  }

  /**
   * Validate object against its `class-validator` field decorators,
   * throwing `ValidationError` on failure to validate.
   *
   * @param kindOfObject Human-readable name for the kind of object being
   *    validated; used to describe error in error messages
   * @param reportFieldMessages Whether to include per-field error messages
   *    in exception message
   * @throws ValidationError when the object is invalid
   */
  protected validate(kindOfObject: string, reportFieldMessages = true): void {
    assertValid(
      this,
      () => this.toErrorMessage(kindOfObject),
      reportFieldMessages
    );
  }

  /**
   * Constructs the error message to display when the object is invalid.
   * When reporting field error messages, this message precedes the
   * field error messages, delimited by a colon. Can be overridden to
   * provide friendlier messages than "Invalid <kindOfObject>".
   *
   * @param kindOfObject Human-readable name for the kind of object
   */
  protected toErrorMessage(kindOfObject: string): string {
    return "Invalid " + kindOfObject;
  }
}

/**
 * Synchronously validate an object, throwing an error when invalid.
 *
 * @param obj Object whose fields are annotated with validation decorators
 * @param messageOrFunc Message to provide with error, in addition to any per-field
 *    error messages, excluding those of nested fields; may be a function that
 *    returns a string, in order to lazily construct the message as needed
 * @param reportFieldMessages Whether to include per-field error messages
 *    in exception message
 * @throws ValidationError when `obj` is invalid
 */
export function assertValid<T extends ClassType<T>>(
  obj: InstanceType<T>,
  messageOrFunc: string | (() => string),
  reportFieldMessages = true
): void {
  // Stop at first error so can prevent excessive-length
  // strings from being parsed in subsequent validations.
  const errors = validateSync(obj, { stopAtFirstError: true });
  if (errors.length > 0) {
    let fieldMessages: string[] = [];
    if (reportFieldMessages) {
      fieldMessages = errors.flatMap((err) =>
        err.constraints ? Object.values(err.constraints) : []
      );
    }
    let combinedMessage =
      typeof messageOrFunc == "function" ? messageOrFunc() : messageOrFunc;
    if (fieldMessages.length > 0) {
      combinedMessage += ": " + fieldMessages.join("; ");
    }
    throw new ValidationError(combinedMessage);
  }
}

/**
 * Class reporting a validation error
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
  }
}
