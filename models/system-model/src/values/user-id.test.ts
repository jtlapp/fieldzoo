import { testBase64Uuid } from "@fieldzoo/testing-utils";

import { toUserID } from "./user-id.js";

it("accepts only valid user IDs", () => {
  testUserID("Invalid user ID", (value) => toUserID(value));
});

export function testUserID(
  errorSubstring: string,
  test: (value: any) => void,
  exclude = (_skip: any) => false
) {
  testBase64Uuid(errorSubstring, test, exclude);
}
