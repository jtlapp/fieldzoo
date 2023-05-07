import { UnvalidatedFields } from "@fieldzoo/generic-types";
import { testTimestamp } from "@fieldzoo/modeling";

import { User } from "./user";
import { testUserName } from "../values/user-name.test";
import { testUserID } from "../values/user-id.test";
import { testEmailAddress } from "../values/email-address.test";
import { testPasswordHash } from "../values/password-hash.test";
import { testPasswordSalt } from "../values/password-salt.test";
import { getPlatformConfig } from "@fieldzoo/app-config";
import { ValidationException } from "@fieldzoo/multitier-validator";

const MIN_PASSWORD_STRENGTH = "10";
const STRONG_PASSWORD1 = "8afj a aw3rajfla fdj8323214";
const STRONG_PASSWORD2 = "VERYstrongPWevenWithOUTnumbers";
const WEAK_PASSWORD = "passwordpasswordpassword";
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
    testTimestamp(
      ERROR_MSG,
      (accessRevokedAt) => createUser({ accessRevokedAt }),
      (skip) => skip === null
    );
    expect(() => createUser({ accessRevokedAt: null })).not.toThrow();
    testTimestamp(
      ERROR_MSG,
      (createdAt) => createUser({ createdAt }),
      (skip) => skip === undefined
    );
    testTimestamp(
      ERROR_MSG,
      (modifiedAt) => createUser({ modifiedAt }),
      (skip) => skip === undefined
    );

    testPasswordHash(
      ERROR_MSG,
      (passwordHash) => createUser({ passwordHash }),
      (skip) => skip === null
    );
    expect(() => createUser({ passwordHash: null })).not.toThrow();

    testPasswordSalt(
      ERROR_MSG,
      (passwordSalt) => createUser({ passwordSalt }),
      (skip) => skip === null
    );
    expect(() => createUser({ passwordSalt: null })).not.toThrow();
  });

  it("doesn't validate when assumed valid", () => {
    expect(() =>
      User.castFrom(
        {
          id: -1,
          name: "",
          email: "",
          accessRevokedAt: "" as any,
          passwordHash: 0 as any,
          passwordSalt: 0 as any,
        },
        false
      )
    ).not.toThrow();
  });

  it("ID cannot be changed", () => {
    const user = createUser({});
    expect(() => {
      (user as any).id = "pdq";
    }).toThrow("read only");
  });

  test("determining password strength", () => {
    process.env.MIN_PASSWORD_STRENGTH = MIN_PASSWORD_STRENGTH;
    const config = getPlatformConfig();
    expect(User.getPasswordStrength(STRONG_PASSWORD1)).toBeGreaterThan(
      config.minPasswordStrength
    );
    expect(User.getPasswordStrength(WEAK_PASSWORD)).toBeLessThan(
      config.minPasswordStrength
    );
    expect(User.getPasswordStrength(STRONG_PASSWORD2)).toBeGreaterThan(
      config.minPasswordStrength
    );
  });

  test("setting a too-weak password", async () => {
    process.env.MIN_PASSWORD_STRENGTH = MIN_PASSWORD_STRENGTH;
    const user = createUser({});

    await expect(user.setPassword(WEAK_PASSWORD)).rejects.toThrow(
      ValidationException
    );
    await expect(user.setPassword(WEAK_PASSWORD)).rejects.toThrow(
      "not strong enough"
    );
    expect(await user.verifyPassword(WEAK_PASSWORD)).toBe(false);
  });

  test("password authentication", async () => {
    process.env.MIN_PASSWORD_STRENGTH = MIN_PASSWORD_STRENGTH;
    const user = createUser({});

    // no password set
    expect(await user.verifyPassword(STRONG_PASSWORD1)).toBe(false);
    expect(await user.verifyPassword("")).toBe(false);
    expect(await user.verifyPassword(null as unknown as string)).toBe(false);
    expect(await user.verifyPassword(undefined as unknown as string)).toBe(
      false
    );

    // set password
    await user.setPassword(STRONG_PASSWORD1);
    expect(await user.verifyPassword(STRONG_PASSWORD1)).toBe(true);
    expect(await user.verifyPassword("foo")).toBe(false);

    // change password
    await user.setPassword(STRONG_PASSWORD2);
    expect(await user.verifyPassword(STRONG_PASSWORD2)).toBe(true);
    expect(await user.verifyPassword(STRONG_PASSWORD1)).toBe(false);

    // access revoked
    user.accessRevokedAt = new Date();
    expect(await user.verifyPassword(STRONG_PASSWORD2)).toBe(false);
  });
});

function createUser(
  specifiedFields: Partial<UnvalidatedFields<User>> & {
    passwordHash?: string | null;
    passwordSalt?: string | null;
  }
) {
  return User.castFrom({
    id: 1,
    name: "Joey",
    email: "x@yz.com",
    accessRevokedAt: null,
    passwordHash: null,
    passwordSalt: null,
    ...specifiedFields,
  });
}
