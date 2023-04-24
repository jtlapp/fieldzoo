/**
 * TypeBox wrapper facilitating safe server-side data validation. The
 * `safeValidate` method short-circuits at the first validation error and
 * reports only this error. TypeBox will test a `maxLength` constraint
 * before testing a regex pattern, so `safeValidate` will prevent an
 * excessive length string from being parsed. It also quits at the first
 * error, preventing the server from wasting clock cycles on bad data.
 * The `unsafeValidate` method will report all validation errors.
 */

import type { TSchema } from "@sinclair/typebox";
import {
  TypeCheck,
  TypeCompiler,
  ValueError,
} from "@sinclair/typebox/compiler";

import { InvalidShapeError } from "./invalid-shape-error";

/**
 * Class whose instances can safely validate object fields.
 */
export class SafeValidator<S extends TSchema> {
  readonly #compiledType: TypeCheck<S>;

  /**
   * Constructor
   *
   * @param schema Schema against which to validate values. Include a `message`
   *    key in a type's options to provide that messge instead of the default
   *    TypeBox message when the key's value fails validation. When an object
   *    is validated, each occurrence of "{field}" within the message will be
   *    replaced with the name of the field that failed validation.
   */
  constructor(schema: S) {
    this.#compiledType = TypeCompiler.Compile(schema);
  }

  /**
   * Safely validate a value against the schema. Short-circuits at the first
   * validation error, reporting only this error.
   *
   * @param value Value to validate against the schema.
   * @param errorMessage Error message to use in the ValidationException when
   *    thrown. The exception also reports the details of the first error.
   * @throws ValidationException when the value is invalid.
   */
  safeValidate(value: unknown, errorMessage: string): void {
    if (!this.#compiledType.Check(value)) {
      const firstError: ValueError = this.#compiledType.Errors(value).next()!
        .value;
      throw new InvalidShapeError(errorMessage, [firstError]);
    }
  }

  /**
   * Unsafely validate a value against the schema, but have the validation
   * exception report all detectable validation errors.
   *
   * @param value Value to validate against the schema.
   * @param errorMessage Error message to use in the ValidationException when
   *    thrown. The exception also reports the details of all validation errors.
   * @throws ValidationException when the value is invalid.
   */
  unsafeValidate(value: unknown, errorMessage: string): void {
    if (!this.#compiledType.Check(value)) {
      throw new InvalidShapeError(errorMessage, [
        ...this.#compiledType.Errors(value),
      ]);
    }
  }
}
