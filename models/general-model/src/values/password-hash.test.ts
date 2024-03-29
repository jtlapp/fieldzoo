import { NON_STRINGS, testValues } from "@fieldzoo/testing-utils";

import { toPasswordHash } from "./password-hash";

const VALID = ["09AF" + "0".repeat(toPasswordHash.schema.maxLength! - 4)];
const INVALID = [
  "",
  ...NON_STRINGS,
  "1234", // too short
  " 1234 ",
  "0".repeat(toPasswordHash.schema.maxLength! + 1),
];

it("accepts only valid password hashes", () => {
  testPasswordHash("Invalid password hash", (value) => toPasswordHash(value));
});

export function testPasswordHash(
  errorSubstring: string,
  test: (value: any) => void,
  exclude = (_skip: any) => false
) {
  testValues(VALID, INVALID, errorSubstring, test, exclude);
}
