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
  testUserName("Invalid user name", (value) => UserNameImpl.castFrom(value));
});

export function testUserName(
  errorSubstring: string,
  test: (value: any) => void,
  exclude = (_skip: any) => false
) {
  testValues(VALID, INVALID, exclude, test, errorSubstring);
}
