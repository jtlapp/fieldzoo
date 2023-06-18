import { testUUID } from "@fieldzoo/testing-utils";

import { UserIDImpl } from "./user-id";

it("accepts only valid user IDs", () => {
  testUUID("Invalid user ID", (value) => UserIDImpl.castFrom(value));
});
