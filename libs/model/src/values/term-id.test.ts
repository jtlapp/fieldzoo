import { TermIDImpl } from "./term-id";
import { testNumericID } from "../util/test-numeric-id";

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
