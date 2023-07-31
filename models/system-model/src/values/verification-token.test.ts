import { testBase64Uuid } from "@fieldzoo/testing-utils";

import { toVerificationToken } from "./verification-token.js";

it("accepts only valid verification tokens", () => {
  testVerificationToken("Invalid verification token", (value) =>
    toVerificationToken(value)
  );
});

export function testVerificationToken(
  errorSubstring: string,
  test: (value: any) => void,
  exclude = (_skip: any) => false
) {
  testBase64Uuid(errorSubstring, test, exclude);
}
