import { VersionNumberImpl } from "./version-number";
import { testNumericID } from "../util/test-numeric-id";

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
  testNumericID(errorSubstring, test, exclude);
}
