import {
  NON_STRINGS,
  UNTRIMMED_STRINGS,
  testValues,
} from "@fieldzoo/testing-utils";

import { toUserDisplayName } from "./user-display-name.js";

const VALID = [
  "Joey",
  "Mark Heüße",
  "a".repeat(toUserDisplayName.schema.maxLength!),
];
const INVALID = [
  "",
  ...NON_STRINGS,
  ...UNTRIMMED_STRINGS,
  "a", // too short
  "a".repeat(toUserDisplayName.schema.maxLength! + 1),
  "a\nb",
  "a\tb",
  "a/b",
];

it("accepts only valid user names", () => {
  testUserDisplayName("Invalid user name", (value) => toUserDisplayName(value));
});

export function testUserDisplayName(
  errorSubstring: string,
  test: (value: any) => void,
  exclude = (_skip: any) => false
) {
  testValues(VALID, INVALID, errorSubstring, test, exclude);
}
