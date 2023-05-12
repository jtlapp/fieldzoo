import { User } from "./user";
import { testUserName } from "../values/user-name.test";
import { testUserHandle } from "../values/user-handle.test";
import { UserID } from "../values/user-id";
import { EmailAddress } from "@fieldzoo/modeling";
import { UserName } from "../values/user-name";
import { UserHandle } from "../values/user-handle";

const ERROR_MSG = "Invalid user";

describe("User entity", () => {
  it("accepts only valid user updates", () => {
    const user = createUser();

    testUserHandle(ERROR_MSG, (handle) =>
      user.updateFrom({ name: user.name, handle })
    );
    testUserName(ERROR_MSG, (name) =>
      user.updateFrom({ name, handle: user.handle })
    );
  });

  it("ID cannot be changed", () => {
    const user = createUser();

    expect(() => {
      (user as any).id = "pdq";
    }).toThrow("read only");
  });
});

function createUser(): User {
  const timestamp = new Date();
  return User.createFrom({
    id: "ae19af00-af09-af09-af09-abcde129af00" as UserID,
    email: "x@yz.com" as EmailAddress,
    name: "Jane Doe" as UserName,
    handle: "jdoe" as UserHandle,
    lastSignInAt: timestamp,
    bannedUntil: null,
    createdAt: timestamp,
    modifiedAt: timestamp,
    deletedAt: null,
  });
}
