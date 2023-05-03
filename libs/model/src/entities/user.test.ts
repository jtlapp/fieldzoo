import { UnvalidatedFields } from "@fieldzoo/generic-types";
import { testTimestamps } from "@fieldzoo/modeling";

import { User } from "./user";
import { testUserName } from "../values/user-name.test";
import { testUserID } from "../values/user-id.test";
import { testEmailAddress } from "../values/email-address.test";

const ERROR_MSG = "Invalid user";

describe("User entity", () => {
  it("accepts only valid users", () => {
    // undefined ID defaults to 0
    expect(() => createUser({ id: undefined })).not.toThrow();
    expect(() => createUser({ id: 0 })).not.toThrow();
    testUserID(
      ERROR_MSG,
      (id) => createUser({ id }),
      (skip) => [undefined, 0].includes(skip)
    );

    testUserName(ERROR_MSG, (name) => createUser({ name }));
    testEmailAddress(ERROR_MSG, (email) => createUser({ email }));
    testTimestamps(ERROR_MSG, (createdAt, modifiedAt) =>
      createUser({ createdAt, modifiedAt })
    );
  });

  it("doesn't validate when assumed valid", () => {
    expect(() =>
      User.castFrom({ id: -1, name: "", email: "" }, false)
    ).not.toThrow();
  });

  it("ID cannot be changed", () => {
    const user = createUser({});
    expect(() => {
      (user as any).id = "pdq";
    }).toThrow("read only");
  });
});

function createUser(specifiedFields: Partial<UnvalidatedFields<User>>) {
  return User.castFrom({
    id: 1,
    name: "Joey",
    email: "x@yz.com",
    ...specifiedFields,
  });
}
