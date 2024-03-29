import { CompilingStandardValidator } from "typebox-validators/standard/index.js";

import {
  NON_STRINGS,
  UNTRIMMED_STRINGS,
  testValues,
} from "@fieldzoo/testing-utils";

import { toNormalizedName } from "../values/normalized-name";

const VALID = [
  "x",
  "house",
  "heüße-house",
  "a".repeat(toNormalizedName.schema.maxLength!),
];
const INVALID = [
  "",
  ...NON_STRINGS,
  ...UNTRIMMED_STRINGS,
  "kitty house",
  "a\ta",
  "a\na",
  "a".repeat(toNormalizedName.schema.maxLength! + 1),
];

it("accepts only valid normalized names", () => {
  const validator = new CompilingStandardValidator(toNormalizedName.schema);

  testNormalizedName("invalid", (value) =>
    // Because toNormalizedName() receives a valid DisplayName, it
    // doesn't need to do validation, so we need to call validate() directly.
    validator.validate(value, "invalid")
  );
});

export function testNormalizedName(
  errorSubstring: string,
  test: (value: any) => void,
  exclude = (_skip: any) => false
) {
  testValues(VALID, INVALID, errorSubstring, test, exclude);
}
