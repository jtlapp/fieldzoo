import { NON_STRINGS, testValues } from "@fieldzoo/testing-utils";

import { PasswordHashImpl } from "./password-hash";

const VALID = ["09AF" + "0".repeat(PasswordHashImpl.schema.maxLength! - 4)];
const INVALID = [
  "",
  ...NON_STRINGS,
  "1234", // too short
  " 1234 ",
  "0".repeat(PasswordHashImpl.schema.maxLength! + 1),
];

it("accepts only valid password hashes", () => {
  testPasswordHash("Invalid password hash", (value) =>
    PasswordHashImpl.castFrom(value)
  );
});

export function testPasswordHash(
  errorSubstring: string,
  test: (value: any) => void,
  exclude = (_skip: any) => false
) {
  testValues(VALID, INVALID, errorSubstring, test, exclude);
}
