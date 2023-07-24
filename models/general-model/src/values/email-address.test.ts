import { NON_STRINGS, testValues } from "@fieldzoo/testing-utils";

import { toEmailAddress } from "../values/email-address";

const VALID = [
  "a@b.c",
  "a.b@c.d",
  "a".repeat(toEmailAddress.schema.maxLength! - 4) + "@b.c",
];
const INVALID = [
  "",
  ...NON_STRINGS,
  "word",
  "word place",
  " a@b.c",
  "a@b.c ",
  "a\ta@b.c",
  "a\na@b.c",
  "a",
  "a".repeat(toEmailAddress.schema.maxLength! - 3) + "@b.c",
];

it("accepts only valid email addresses", () => {
  testEmailAddress("Invalid email address", (value) => toEmailAddress(value));
});

export function testEmailAddress(
  errorSubstring: string,
  test: (value: any) => void,
  exclude = (_skip: any) => false
) {
  testValues(VALID, INVALID, errorSubstring, test, exclude);
}
