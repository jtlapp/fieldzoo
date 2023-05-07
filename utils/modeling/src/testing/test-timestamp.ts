import { testValues } from "./test-values";

const VALID = [new Date("1/2/23")];
const INVALID = [new Date("oopsie"), "" as unknown as Date, null, undefined, 0];

export function testTimestamp(
  errorSubstring: string,
  test: (value: any) => void,
  exclude = (_skip: any) => false
) {
  testValues(VALID, INVALID, errorSubstring, test, exclude);
}
