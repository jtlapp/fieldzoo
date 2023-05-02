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
  exclusionCheck: (candidate: any) => boolean,
  test: (candidate: any) => void,
  errorSubstring: string
) {
  for (const value of validValues) {
    if (!exclusionCheck(value)) {
      expect(() => test(value)).not.toThrow();
    }
  }
  for (const value of invalidValues) {
    if (!exclusionCheck(value)) {
      expect(() => test(value)).toThrow(errorSubstring);
    }
  }
}
