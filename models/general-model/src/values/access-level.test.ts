import { testValues, NON_NUMBERS } from "@fieldzoo/testing-utils";

import { AccessLevel, toAccessLevel } from "./access-level";

const VALID = [AccessLevel.None, AccessLevel.Read, AccessLevel.Owner];
const INVALID = [
  AccessLevel.None - 1,
  AccessLevel.Owner + 1,
  1.5,
  ...NON_NUMBERS,
];

it("accepts only valid permissionss", () => {
  testAccessLevel(
    "Invalid permissions",
    (value) => toAccessLevel(value),
    () => false
  );
});

export function testAccessLevel(
  errorSubstring: string,
  test: (value: any) => void,
  exclude = (_skip: any) => false
) {
  testValues(VALID, INVALID, errorSubstring, test, exclude);
}
