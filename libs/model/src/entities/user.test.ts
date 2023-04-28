import { User } from "./user";

import { UserID } from "../values/user-id";
import { testTimestamps } from "../lib/timestamped-entity.util";

const maxNameLength = User.schema.properties.name.maxLength!;

const ID = 1 as UserID;
const EMAIL = "x@yz.com";

describe("User entity", () => {
  it("accepts valid users", () => {
    expect(() => createUser(undefined, "Mo", EMAIL)).not.toThrow();
    expect(() => createUser(0, "Mo", EMAIL)).not.toThrow();
    expect(() => createUser(ID, "Mo", EMAIL)).not.toThrow();
    expect(() => createUser(ID, "Mark Heüße", EMAIL)).not.toThrow();
    const maxLength = "A".repeat(maxNameLength);
    expect(() => createUser(ID, maxLength, EMAIL)).not.toThrow();
  });

  it("rejects invalid IDs", () => {
    expect(() => createUser(-1, "Foo", EMAIL)).toThrow("Invalid user");
  });

  it("rejects invalid user names", () => {
    expect(() => createUser(ID, "", EMAIL)).toThrow("Invalid user");
    expect(() => createUser(ID, "X", EMAIL)).toThrow("Invalid user");
    expect(() => createUser(ID, "x/y", EMAIL)).toThrow("Invalid user");
    const tooLong = "A".repeat(maxNameLength + 1);
    expect(() => createUser(ID, tooLong, EMAIL)).toThrow("Invalid user");
  });

  it("rejects invalid emails", () => {
    expect(() => createUser(ID, "Tom", "oopsie")).toThrow("Invalid user");
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
