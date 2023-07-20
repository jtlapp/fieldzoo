import {
  NON_STRINGS,
  UNTRIMMED_STRINGS,
  testValues,
} from "@fieldzoo/testing-utils";

import { UserHandleImpl } from "./user-handle.js";

const VALID = [
  "Mo",
  "a1",
  "ab_cd_2",
  "a".repeat(UserHandleImpl.schema.maxLength!),
];
const INVALID = [
  "",
  ...NON_STRINGS,
  ...UNTRIMMED_STRINGS,
  "a", // too short
  "a".repeat(UserHandleImpl.schema.maxLength! + 1),
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
  testUserHandle("Invalid user handle", (value) =>
    UserHandleImpl.castFrom(value)
  );
});

export function testUserHandle(
  errorSubstring: string,
  test: (value: any) => void,
  exclude = (_skip: any) => false
) {
  testValues(VALID, INVALID, errorSubstring, test, exclude);
}
