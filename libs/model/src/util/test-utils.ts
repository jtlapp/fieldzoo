export const NON_NUMBERS = [
  "",
  " ",
  "1",
  "1.5",
  "word",
  true,
  {},
  null,
  undefined,
];

export const NON_STRINGS = [0, 111, 1.5, true, {}, null, undefined];

export const UNTRIMMED_STRINGS = [
  " ",
  "  ",
  " word",
  "word ",
  " word ",
  "\n",
  "\t",
];

export function testValues(
  validValues: any[],
  invalidValues: any[],
  errorSubstring: string,
  test: (candidate: any) => void,
  exclude: (skip: any) => boolean
) {
  for (const value of validValues) {
    if (!exclude(value)) {
      // console.log(`value '${value}' should not throw`);
      expect(() => test(value)).not.toThrow();
    }
  }
  for (const value of invalidValues) {
    if (!exclude(value)) {
      // console.log(`value '${value}' should throw`);
      expect(() => test(value)).toThrow(errorSubstring);
    }
  }
}
