import { testNumericID } from "@fieldzoo/modeling";

import { UserIDImpl } from "./user-id";

it("accepts only valid user IDs", () => {
  testUserID("Invalid user ID", (value) => UserIDImpl.castFrom(value));
});

export function testUserID(
  errorSubstring: string,
  test: (value: any) => void,
  exclude = (_skip: any) => false
) {
  testNumericID(errorSubstring, test, exclude);
}
