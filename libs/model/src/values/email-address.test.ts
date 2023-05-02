import { NON_STRINGS, testValues } from "../util/test-utils";
import { EmailAddressImpl } from "../values/email-address";

const VALID = [
  "a@b.c",
  "a.b@c.d",
  "a".repeat(EmailAddressImpl.schema.maxLength! - 4) + "@b.c",
];
const INVALID = [
  "",
  ...NON_STRINGS,
  "word",
  "word place",
  " a@b.c",
  "a@b.c ",
  "a\ta@b.c",
  "a",
  "a".repeat(EmailAddressImpl.schema.maxLength! - 3) + "@b.c",
];

it("accepts only valid email addresses", () => {
  testEmailAddress(
    () => false,
    (value) => EmailAddressImpl.castFrom(value)
  );
});

export function testEmailAddress(
  exclusionCheck: (candidate: any) => boolean,
  test: (value: any) => void,
  errorSubstring = "Invalid email address"
) {
  testValues(VALID, INVALID, exclusionCheck, test, errorSubstring);
}
