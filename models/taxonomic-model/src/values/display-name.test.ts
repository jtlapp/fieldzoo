import { NON_STRINGS, UNTRIMMED_STRINGS, testValues } from "@fieldzoo/modeling";

import { DisplayNameImpl } from "../values/display-name";

const VALID = [
  "X",
  "House",
  "Heüße House",
  "Kitty-House",
  "a".repeat(DisplayNameImpl.schema.maxLength!),
];
const INVALID = [
  "",
  ...NON_STRINGS,
  ...UNTRIMMED_STRINGS,
  "abc  def",
  "a\ta",
  "a\na",
  "a".repeat(DisplayNameImpl.schema.maxLength! + 1),
];

it("accepts only valid display names", () => {
  testDisplayName("Invalid display name", (value) =>
    DisplayNameImpl.castFrom(value)
  );
});

export function testDisplayName(
  errorSubstring: string,
  test: (value: any) => void,
  exclude = (_skip: any) => false
) {
  testValues(VALID, INVALID, errorSubstring, test, exclude);
}
