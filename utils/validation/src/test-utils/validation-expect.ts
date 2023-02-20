/**
 * Utilities for testing `class-validator`-based validation.
 */

import { TypeCompiler } from "@sinclair/typebox/compiler";

import { validate, ValidationError } from "../lib/validation";

/**
 * Expect an object to fail `class-validator` validation, taking either a
 * specification for validating an object or a function that validates an
 * object. Require certain substrings to be present among the error messages
 * and certain substrings to be absent.
 *
 * @param jestExpect The jest `expect` function, provided at runtime so it
 *    doesn't get linked in with production code
 * @param checker The compiled TypeBox schema against which to validate the value.
 * @param validationSpecOrFunc Either a validation specification tuple
 *    [<object-to-validate>, <error-message-prefix>] or a function that
 *    validates an object when called.
 * @param expectedSubstrings Array of substrings expected to be found among
 *    the error messages
 * @param unexpectedSubstrings Array of substrings expected to be absent from
 *    the error messages
 * @param appendFieldErrors Whether to have `InvalidationError` append
 *    individual field errors to the toString() representation.
 * @throws Whatever jest's `expect` method throws on a failed test
 */
export function expectInvalid(
  jestExpect: any, // Jest does not make it easy to import the correct type
  checker: ReturnType<typeof TypeCompiler.Compile>,
  validationSpecOrFunc: [object, string] | (() => object),
  expectedSubstrings: string[],
  unexpectedSubstrings: string[] = [],
  appendFieldErrors = true,
): void {
  try {
    if (typeof validationSpecOrFunc == "function") {
      validationSpecOrFunc();
    } else {
      const [obj, message] = validationSpecOrFunc;
      validate(checker, obj, message);
    }
    throw new Error("expected an exception");
  } catch (err: any) {
    jestExpect(err).toBeInstanceOf(ValidationError);
    const message = (err as ValidationError).toString(appendFieldErrors);
    for (const substr of expectedSubstrings) {
      jestExpect(message).toContain(substr);
    }
    for (const substr of unexpectedSubstrings) {
      jestExpect(message).not.toContain(substr);
    }
  }
}
