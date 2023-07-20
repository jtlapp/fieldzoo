import { testUUID } from "@fieldzoo/testing-utils";

import { UserIDImpl } from "./user-id.js";

it("accepts only valid user IDs", () => {
  testUUID("Invalid user ID", (value) => UserIDImpl.castFrom(value));
});
