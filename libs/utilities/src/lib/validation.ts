import { validateSync } from "class-validator";

import { ClassType } from "./generic-types";

/**
 * Synchronously validate an object, throwing an error when invalid.
 *
 * @param obj Object whose fields are annotated with validation decorators
 * @param message Message to provide with error, in addition to any per-field
 *    error messages, excluding those of nested fields
 * @throws ValidationError when `obj` is invalid
 */
export function assertValidSync<T extends ClassType<T>>(
  obj: InstanceType<T>,
  message: string,
  reportFieldMessages = true
): void {
  const errors = validateSync(obj);
  if (errors.length > 0) {
    let fieldMessages: string[] = [];
    if (reportFieldMessages) {
      fieldMessages = errors.flatMap((err) =>
        err.constraints ? Object.values(err.constraints) : []
      );
    }
    let combinedMessage = message;
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
