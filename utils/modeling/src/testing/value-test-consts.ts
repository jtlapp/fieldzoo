/**
 * Constants for use in testing model values.
 */

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
