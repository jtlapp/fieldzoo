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
  testEmailAddress("Invalid email address", (value) =>
    EmailAddressImpl.castFrom(value)
  );
});

export function testEmailAddress(
  errorSubstring: string,
  test: (value: any) => void,
  exclude = (_skip: any) => false
) {
  testValues(VALID, INVALID, errorSubstring, test, exclude);
}
