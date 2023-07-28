import { BASE64_UUID_LENGTH } from "@fieldzoo/base64-uuid";
import { EmailAddress } from "@fieldzoo/general-model";

import { User } from "./user.js";
import { testUserID } from "../values/user-id.test";
import { UserID } from "../values/user-id.js";
import { UserDisplayName } from "../values/user-display-name.js";
import { UserHandle } from "../values/user-handle.js";
import { UnvalidatedFields } from "@fieldzoo/generic-types";

const SAMPLE_USER_ID = "X".repeat(BASE64_UUID_LENGTH);
const ERROR_MSG = "Invalid user";

describe("User entity", () => {
  it("accepts only valid users", () => {
    expect(() => createUser({ id: undefined })).not.toThrow();
    expect(() => createUser({ id: "" })).not.toThrow();
    testUserID(
      ERROR_MSG,
      (id) => createUser({ id }),
      (skip) => [undefined, ""].includes(skip)
    );
  });

  it("ID cannot be changed", () => {
    const user = createUser({});

    expect(() => {
      (user as any).id = "pdq";
    }).toThrow("read only");
  });
});

function createUser(specifiedFields: Partial<UnvalidatedFields<User>>): User {
  const timestamp = new Date();
  return User.castFrom({
    id: SAMPLE_USER_ID as UserID,
    email: "x@yz.com" as EmailAddress,
    displayName: "Jane Doe" as UserDisplayName,
    userHandle: "jdoe" as UserHandle,
    lastLoginAt: timestamp,
    createdAt: timestamp,
    modifiedAt: timestamp,
    disabledAt: null,
    ...(specifiedFields as any),
  });
}
