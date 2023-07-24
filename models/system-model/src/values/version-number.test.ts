import { testPositiveInt } from "@fieldzoo/testing-utils";

import { toVersionNumber } from "./version-number.js";

it("accepts only valid version numbers", () => {
  testVersionNumber("Invalid version number", (value) =>
    toVersionNumber(value)
  );
});

export function testVersionNumber(
  errorSubstring: string,
  test: (value: any) => void,
  exclude = (_skip: any) => false
) {
  testPositiveInt(errorSubstring, test, exclude);
}
