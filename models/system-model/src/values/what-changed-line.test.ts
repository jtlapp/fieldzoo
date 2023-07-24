import {
  NON_STRINGS,
  UNTRIMMED_STRINGS,
  testValues,
} from "@fieldzoo/testing-utils";

import { toWhatChangedLine } from "./what-changed-line.js";

const VALID = [
  "X",
  "House",
  "Heüße House",
  "Kitty-House",
  "a".repeat(toWhatChangedLine.schema.maxLength!),
];
const INVALID = [
  "",
  ...NON_STRINGS,
  ...UNTRIMMED_STRINGS,
  "abc  def",
  "a\ta",
  "a\na",
  "a".repeat(toWhatChangedLine.schema.maxLength! + 1),
];

it("accepts only valid what-changed lines", () => {
  testWhatChangedLine("Invalid what-changed line", (value) =>
    toWhatChangedLine(value)
  );
});

export function testWhatChangedLine(
  errorSubstring: string,
  test: (value: any) => void,
  exclude = (_skip: any) => false
) {
  testValues(VALID, INVALID, errorSubstring, test, exclude);
}
