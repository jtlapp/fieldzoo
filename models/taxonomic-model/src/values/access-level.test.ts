import { testValues, NON_NUMBERS } from "@fieldzoo/testing-utils";

import { AccessLevel, AccessLevelImpl } from "./access-level";

const VALID = [AccessLevel.None, AccessLevel.Read, AccessLevel.Owner];
const INVALID = [
  AccessLevel.None - 1,
  AccessLevel.Owner + 1,
  1.5,
  ...NON_NUMBERS,
];

it("accepts only valid permissionss", () => {
  testValues(
    VALID,
    INVALID,
    "Invalid permissions",
    (value) => AccessLevelImpl.castFrom(value),
    () => false
  );
});
