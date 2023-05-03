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

let showingValuesDiagnostics = false;

export function showValuesDiagnostics(show: boolean) {
  showingValuesDiagnostics = show;
}

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
  test: (value: any) => void,
  exclude: (skip: any) => boolean
) {
  for (const value of validValues) {
    if (!exclude(value)) {
      expect(() =>
        showingValuesDiagnostics
          ? testValueWithDiagnostics(value, test, true)
          : test(value)
      ).not.toThrow();
    }
  }
  for (const value of invalidValues) {
    if (!exclude(value)) {
      expect(() =>
        showingValuesDiagnostics
          ? testValueWithDiagnostics(value, test, true)
          : test(value)
      ).toThrow(errorSubstring);
    }
  }
}

function testValueWithDiagnostics(
  value: any,
  test: (value: any) => void,
  shouldThrow: boolean
) {
  try {
    console.log(`value '${value}' should ${shouldThrow ? "" : "not"} throw`);
    test(value);
  } catch (err: any) {
    // ValidationException.toString() takes whether to show details
    console.log(`value '${value}' threw ${err.toString(true)}`);
    throw err;
  }
}
