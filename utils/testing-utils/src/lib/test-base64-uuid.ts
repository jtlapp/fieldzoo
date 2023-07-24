import { NON_STRINGS } from "./test-constants";
import { testValues } from "./test-values";

const BASE64_UUID_LENGTH = 22;

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
  "a".repeat(BASE64_UUID_LENGTH - 1),
  "a".repeat(BASE64_UUID_LENGTH + 1),
];

export function testBase64Uuid(
  errorSubstring: string,
  test: (value: any) => void,
  exclude = (_skip: any) => false
) {
  testValues(VALID, INVALID, errorSubstring, test, exclude);
}
