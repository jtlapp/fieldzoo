import { testValues } from "./test-values";

const VALID = [new Date("1/2/23")];
const INVALID = [
  new Date("oopsie"),
  "1/2/23" as unknown as Date,
  "" as unknown as Date,
  null,
  undefined,
  0,
];

export function testDate(
  errorSubstring: string,
  test: (value: any) => void,
  exclude = (_skip: any) => false
) {
  testValues(VALID, INVALID, errorSubstring, test, exclude);
}
