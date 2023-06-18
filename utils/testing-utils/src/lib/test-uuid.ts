import { NON_STRINGS, UNTRIMMED_STRINGS } from "./test-constants";
import { testValues } from "./test-values";

const VALID = [
  "00000000-0000-0000-0000-000000000000",
  "ae19af00-af09-af09-af09-abcde129af00",
  "AE19AF00-AF09-AF09-AF09-ABCDE129AF00",
];
const INVALID = [
  "",
  ...NON_STRINGS,
  ...UNTRIMMED_STRINGS,
  "a", // too short
  "gggggggg-gggg-gggg-gggg-gggggggggggg",
  "ae19AF00aF09aF09aF09aBcDe129AF00",
];

export function testUUID(
  errorSubstring: string,
  test: (value: any) => void,
  exclude = (_skip: any) => false
) {
  testValues(VALID, INVALID, errorSubstring, test, exclude);
}
