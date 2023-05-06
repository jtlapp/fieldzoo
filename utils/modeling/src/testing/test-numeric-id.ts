import { NON_NUMBERS } from "./value-test-consts";
import { testValues } from "./test-values";

const VALID = [1, 2, 2000];
const INVALID = [-1, 0, 1.5, ...NON_NUMBERS];

export function testNumericID(
  errorSubstring: string,
  test: (value: any) => void,
  exclude: (_skip: any) => boolean
) {
  testValues(VALID, INVALID, errorSubstring, test, exclude);
}
