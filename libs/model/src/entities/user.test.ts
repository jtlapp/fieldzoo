import { testTimestamps } from "@fieldzoo/modeling";

import { User } from "./user";
import { UserID } from "../values/user-id";
import { testUserName } from "../values/user-name.test";
import { testUserID } from "../values/user-id.test";
import { testEmailAddress } from "../values/email-address.test";

const ID = 1 as UserID;
const EMAIL = "x@yz.com";

describe("User entity", () => {
  it("accepts valid users", () => {
    expect(() => createUser(undefined, "Joey", EMAIL)).not.toThrow();
    expect(() => createUser(0, "Joey", EMAIL)).not.toThrow();
    expect(() => createUser(ID, "Joey", EMAIL)).not.toThrow();
  });

  it("accepts only valid IDs", () => {
    testUserID(
      (candidate) => [0, undefined].includes(candidate),
      (value) => createUser(value, "Joey", EMAIL),
      "Invalid user"
    );
    expect(() => createUser(0, "Joey", EMAIL)).not.toThrow();
  });

  it("accepts only valid user names", () => {
    testUserName(
      () => false,
      (value) => createUser(ID, value, EMAIL),
      "Invalid user"
    );
  });

  it("accepts only valid email addresses", () => {
    testEmailAddress(
      () => false,
      (value) => createUser(ID, "Mo", value),
      "Invalid user"
    );
  });

  it("accepts only valid timestamps", () => {
    testTimestamps("Invalid user", (createdAt, modifiedAt) =>
      createUser(ID, "Mo", EMAIL, createdAt, modifiedAt)
    );
  });

  it("doesn't validate when assumed valid", () => {
    expect(() =>
      User.castFrom({ id: ID, name: "", email: "" }, false)
    ).not.toThrow();
  });

  it("ID cannot be changed", () => {
    const user = createUser(ID, "Jeff Blarg", EMAIL);
    expect(() => {
      (user as any).id = "pdq";
    }).toThrow("read only");
  });
});

function createUser(
  id: number | undefined,
  name: string,
  email: string,
  createdAt?: Date,
  modifiedAt?: Date
) {
  return User.castFrom({
    id: id as UserID,
    name,
    email,
    createdAt,
    modifiedAt,
  });
}
