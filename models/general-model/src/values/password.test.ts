import { NON_STRINGS, testValues } from "@fieldzoo/testing-utils";

import { toPassword } from "./password";

const VALID = [
  "x".repeat(toPassword.schema.minLength!),
  "y".repeat(toPassword.schema.maxLength!),
];
const INVALID = [
  "",
  ...NON_STRINGS,
  "x".repeat(toPassword.schema.minLength! - 1),
  "y".repeat(toPassword.schema.maxLength! + 1),
];

it("accepts only valid passwords", () => {
  testPassword("Invalid password", (value) => toPassword(value));
});

export function testPassword(
  errorSubstring: string,
  test: (value: any) => void,
  exclude = (_skip: any) => false
) {
  testValues(VALID, INVALID, errorSubstring, test, exclude);
}
