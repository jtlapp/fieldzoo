import { testBase64Uuid } from "@fieldzoo/testing-utils";

import { UserIDImpl } from "./user-id.js";

it.only("accepts only valid user IDs", () => {
  testUserID("Invalid user ID", (value) => UserIDImpl.castFrom(value));
});

export function testUserID(
  errorSubstring: string,
  test: (value: any) => void,
  exclude = (_skip: any) => false
) {
  testBase64Uuid(errorSubstring, test, exclude);
}
