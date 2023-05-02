import { NON_NUMBERS, testValues } from "../util/test-utils";

const VALID = [1, 2, 2000];
const INVALID = [-1, 0, 1.5, ...NON_NUMBERS];

export function testNumericID(
  exclusionCheck: (candidate: any) => boolean,
  test: (value: any) => void,
  errorSubstring: string
) {
  testValues(VALID, INVALID, exclusionCheck, test, errorSubstring);
}
