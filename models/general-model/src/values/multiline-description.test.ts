import {
  NON_STRINGS,
  UNTRIMMED_STRINGS,
  testValues,
} from "@fieldzoo/testing-utils";

import { MultilineDescriptionImpl } from "../values/multiline-description";

const VALID = [
  "X",
  "House",
  "Heüße House",
  "Kitty-House\n\nHeüße House\nABC",
  "a".repeat(MultilineDescriptionImpl.schema.maxLength!),
];
const INVALID = [
  "",
  ...NON_STRINGS,
  ...UNTRIMMED_STRINGS,
  "\n",
  "\n\n",
  "a\ta",
  "a".repeat(MultilineDescriptionImpl.schema.maxLength! + 1),
];

it("accepts only valid multiline descriptions", () => {
  testMultilineDescription("Invalid description", (value) =>
    MultilineDescriptionImpl.castFrom(value)
  );
});

export function testMultilineDescription(
  errorSubstring: string,
  test: (value: any) => void,
  exclude = (_skip: any) => false
) {
  testValues(VALID, INVALID, errorSubstring, test, exclude);
}
