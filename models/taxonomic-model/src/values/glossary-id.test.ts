import { BASE64_UUID_LENGTH } from "@fieldzoo/base64-uuid";
import { NON_STRINGS, testValues } from "@fieldzoo/modeling";

import { GlossaryIDImpl } from "../values/glossary-id";

const sampleValidChars = "aA09-_";
const VALID = [
  sampleValidChars + "x".repeat(BASE64_UUID_LENGTH - sampleValidChars.length),
];
const INVALID = [
  "",
  "  ",
  ...NON_STRINGS,
  "too-short",
  "a\n\t !?" + "x".repeat(BASE64_UUID_LENGTH - 6),
  "a".repeat(GlossaryIDImpl.schema.maxLength! - 1),
  "a".repeat(GlossaryIDImpl.schema.maxLength! + 1),
];

it("accepts only valid glosssary IDs", () => {
  testGlossaryID("Invalid glossary ID", (value) =>
    GlossaryIDImpl.castFrom(value)
  );
});

export function testGlossaryID(
  errorSubstring: string,
  test: (value: any) => void,
  exclude = (_skip: any) => false
) {
  testValues(VALID, INVALID, errorSubstring, test, exclude);
}
