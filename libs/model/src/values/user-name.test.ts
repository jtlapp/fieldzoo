import { NON_STRINGS, UNTRIMMED_STRINGS, testValues } from "../util/test-utils";
import { UserNameImpl } from "./user-name";

const VALID = [
  "Joey",
  "Mark Heüße",
  "a".repeat(UserNameImpl.schema.maxLength!),
];
const INVALID = [
  "",
  ...NON_STRINGS,
  ...UNTRIMMED_STRINGS,
  "a", // too short
  "a".repeat(UserNameImpl.schema.maxLength! + 1),
  "a\nb",
  "a\tb",
  "a/b",
];

it("accepts only valid user names", () => {
  testUserName(
    () => false,
    (value) => UserNameImpl.castFrom(value)
  );
});

export function testUserName(
  exclusionCheck: (candidate: any) => boolean,
  test: (value: any) => void,
  errorSubstring = "Invalid user name"
) {
  testValues(VALID, INVALID, exclusionCheck, test, errorSubstring);
}
