import {
  NON_STRINGS,
  UNTRIMMED_STRINGS,
  testValues,
} from "@fieldzoo/testing-utils";

import { toUserHandle } from "./user-handle.js";

const VALID = [
  "Mo",
  "a1",
  "ab_cd_2",
  "a".repeat(toUserHandle.schema.maxLength!),
];
const INVALID = [
  "",
  ...NON_STRINGS,
  ...UNTRIMMED_STRINGS,
  "a", // too short
  "a".repeat(toUserHandle.schema.maxLength! + 1),
  "a\nb",
  "a\tb",
  "a/b",
  "Heüße",
  "a.b",
  "a-b",
  "a b",
  "0123",
];

it("accepts only valid user handles", () => {
  testUserHandle("Invalid user handle", (value) => toUserHandle(value));
});

export function testUserHandle(
  errorSubstring: string,
  test: (value: any) => void,
  exclude = (_skip: any) => false
) {
  testValues(VALID, INVALID, errorSubstring, test, exclude);
}
