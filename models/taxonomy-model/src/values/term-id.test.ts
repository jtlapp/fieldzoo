import { testPositiveInt } from "@fieldzoo/testing-utils";

import { toTermID } from "./term-id";

it("accepts only valid term IDs", () => {
  testTermID("Invalid term ID", (value) => toTermID(value));
});

export function testTermID(
  errorSubstring: string,
  test: (value: any) => void,
  exclude = (_skip: any) => false
) {
  testPositiveInt(errorSubstring, test, exclude);
}
