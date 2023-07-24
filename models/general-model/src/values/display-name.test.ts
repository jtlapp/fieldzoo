import {
  NON_STRINGS,
  UNTRIMMED_STRINGS,
  testValues,
} from "@fieldzoo/testing-utils";

import { toDisplayName } from "../values/display-name.js";

const VALID = [
  "X",
  "House",
  "Heüße House",
  "Kitty-House",
  "a".repeat(toDisplayName.schema.maxLength!),
];
const INVALID = [
  "",
  ...NON_STRINGS,
  ...UNTRIMMED_STRINGS,
  "abc  def",
  "a\ta",
  "a\na",
  "a".repeat(toDisplayName.schema.maxLength! + 1),
];

it("accepts only valid display names", () => {
  testDisplayName("Invalid display name", (value) => toDisplayName(value));
});

export function testDisplayName(
  errorSubstring: string,
  test: (value: any) => void,
  exclude = (_skip: any) => false
) {
  testValues(VALID, INVALID, errorSubstring, test, exclude);
}
