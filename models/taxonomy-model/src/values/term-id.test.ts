import { testPositiveInt } from "@fieldzoo/testing-utils";

import { TermIDImpl } from "./term-id";

it("accepts only valid term IDs", () => {
  testTermID("Invalid term ID", (value) => TermIDImpl.castFrom(value));
});

export function testTermID(
  errorSubstring: string,
  test: (value: any) => void,
  exclude = (_skip: any) => false
) {
  testPositiveInt(errorSubstring, test, exclude);
}
