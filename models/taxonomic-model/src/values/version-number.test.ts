import { testPositiveInt } from "@fieldzoo/testing-utils";

import { VersionNumberImpl } from "./version-number";

it("accepts only valid version numbers", () => {
  testVersionNumber("Invalid version number", (value) =>
    VersionNumberImpl.castFrom(value)
  );
});

export function testVersionNumber(
  errorSubstring: string,
  test: (value: any) => void,
  exclude = (_skip: any) => false
) {
  testPositiveInt(errorSubstring, test, exclude);
}
