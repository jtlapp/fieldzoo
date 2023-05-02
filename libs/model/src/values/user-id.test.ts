import { UserIDImpl } from "./user-id";
import { testNumericID } from "../util/test-numeric-id";

it("accepts only valid user IDs", () => {
  testUserID(
    () => false,
    (value) => UserIDImpl.castFrom(value)
  );
});

export function testUserID(
  exclusionCheck: (candidate: any) => boolean,
  test: (value: any) => void,
  errorSubstring = "Invalid user ID"
) {
  testNumericID(exclusionCheck, test, errorSubstring);
}
