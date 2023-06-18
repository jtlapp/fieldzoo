import {
  NON_STRINGS,
  UNTRIMMED_STRINGS,
  testValues,
} from "@fieldzoo/testing-utils";

import { WhatChangedLineImpl } from "./what-changed-line";

const VALID = [
  "X",
  "House",
  "Heüße House",
  "Kitty-House",
  "a".repeat(WhatChangedLineImpl.schema.maxLength!),
];
const INVALID = [
  "",
  ...NON_STRINGS,
  ...UNTRIMMED_STRINGS,
  "abc  def",
  "a\ta",
  "a\na",
  "a".repeat(WhatChangedLineImpl.schema.maxLength! + 1),
];

it("accepts only valid what-changed lines", () => {
  testWhatChangedLine("Invalid what-changed line", (value) =>
    WhatChangedLineImpl.castFrom(value)
  );
});

export function testWhatChangedLine(
  errorSubstring: string,
  test: (value: any) => void,
  exclude = (_skip: any) => false
) {
  testValues(VALID, INVALID, errorSubstring, test, exclude);
}
