import { NON_STRINGS, testValues } from "@fieldzoo/testing-utils";

import { PasswordSaltImpl } from "./password-salt";

const VALID = ["09AF" + "0".repeat(PasswordSaltImpl.schema.maxLength! - 4)];
const INVALID = [
  "",
  ...NON_STRINGS,
  "1234", // too short
  " 1234 ",
  "0".repeat(PasswordSaltImpl.schema.maxLength! + 1),
];

it("accepts only valid password salts", () => {
  testPasswordSalt("Invalid password salt", (value) =>
    PasswordSaltImpl.castFrom(value)
  );
});

export function testPasswordSalt(
  errorSubstring: string,
  test: (value: any) => void,
  exclude = (_skip: any) => false
) {
  testValues(VALID, INVALID, errorSubstring, test, exclude);
}
