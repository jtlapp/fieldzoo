/**
 * Utilities for testing `class-validator`-based validation.
 */

import { fail } from "assert";

import { assertValid, ValidationError } from "../lib/validation";

/**
 * Expect an object to fail `class-validator` validation, taking either a
 * specification for validating an object or a function that validates an
 * object. Require certain substrings to be present among the error messages
 * and certain substrings to be absent.
 *
 * @param expectFunc The jest `expect` function, provided at runtime so it
 *    doesn't get linked in with production code
 * @param validationSpecOrFunc Either a validation specification tuple [
 *    <object-to-validate>, <error-message-prefix>, <report-field-messages>]
 *    or a function that validates an object when called.
 * @param expectedSubstrings Array of substrings expected to be found among
 *    the error messages
 * @param unexpectedSubstrings Array of substrings expected to be absent from
 *    the error messages
 * @throws Whatever jest's `expect` method throws on a failed test
 */
export function expectInvalid(
  expectFunc: jest.Expect,
  validationSpecOrFunc: [object, string, boolean] | (() => object),
  expectedSubstrings: string[],
  unexpectedSubstrings: string[] = [],
): void {
  try {
    if (typeof validationSpecOrFunc == "function") {
      validationSpecOrFunc();
    } else {
      const [obj, message, reportFieldMessages] = validationSpecOrFunc;
      assertValid(obj, message, reportFieldMessages);
    }
    fail("expected validation errors");
  } catch (err: any) {
    expectFunc(err).toBeInstanceOf(ValidationError);
    for (const substr of expectedSubstrings) {
      expectFunc(err.message).toContain(substr);
    }
    for (const substr of unexpectedSubstrings) {
      expectFunc(err.message).not.toContain(substr);
    }
  }
}
