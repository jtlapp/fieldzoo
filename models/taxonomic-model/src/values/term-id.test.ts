import { testNumericID } from "@fieldzoo/modeling";

import { TermIDImpl } from "./term-id";

it("accepts only valid term IDs", () => {
  testTermID("Invalid term ID", (value) => TermIDImpl.castFrom(value));
});

export function testTermID(
  errorSubstring: string,
  test: (value: any) => void,
  exclude = (_skip: any) => false
) {
  testNumericID(errorSubstring, test, exclude);
}
