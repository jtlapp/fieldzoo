import {
  NON_STRINGS,
  UNTRIMMED_STRINGS,
  testValues,
} from "@fieldzoo/testing-utils";

import { toUserName } from "./user-name.js";

const VALID = ["Joey", "Mark Heüße", "a".repeat(toUserName.schema.maxLength!)];
const INVALID = [
  "",
  ...NON_STRINGS,
  ...UNTRIMMED_STRINGS,
  "a", // too short
  "a".repeat(toUserName.schema.maxLength! + 1),
  "a\nb",
  "a\tb",
  "a/b",
];

it("accepts only valid user names", () => {
  testUserName("Invalid user name", (value) => toUserName(value));
});

export function testUserName(
  errorSubstring: string,
  test: (value: any) => void,
  exclude = (_skip: any) => false
) {
  testValues(VALID, INVALID, errorSubstring, test, exclude);
}
