import { DatabaseError, PG_UNIQUE_VIOLATION } from "@fieldzoo/postgres-utils";
import {
  getTestDB,
  closeTestDB,
  resetTestDB,
  sleep,
} from "@fieldzoo/testing-utils";

import { User } from "../entities/user";
import { toUserDisplayName } from "../values/user-display-name.js";
import { UserRepo } from "./user-repo";
import { toUserHandle } from "../values/user-handle.js";

const db = getTestDB();

afterAll(() => closeTestDB());

const user1 = User.castFrom({
  displayName: "John Doe",
  email: "jdoe1@xyz.pdq",
  emailVerified: true,
  userHandle: "jdoe",
  lastLoginAt: new Date(),
  createdAt: new Date(),
  modifiedAt: new Date(),
  disabledAt: null,
});
const user2 = User.castFrom({
  displayName: "Jimmy Joe",
  email: "jjoe@xyz.pdq",
  emailVerified: false,
  userHandle: "jj",
  lastLoginAt: new Date(),
  createdAt: new Date(),
  modifiedAt: new Date(),
  disabledAt: null,
});

describe("UserRepo", () => {
  it("inserts, updates, and deletes users", async () => {
    await resetTestDB();
    const userRepo = new UserRepo(db);

    // test updating a non-existent user
    const updateReturn1 = await userRepo.update(user1);
    expect(updateReturn1).toBe(false);

    // test inserting a user

    const insertReturn1 = (await userRepo.add(user1))!;
    expect(insertReturn1).not.toBeNull();
    expect(insertReturn1.id).not.toEqual("");
    expect(insertReturn1.createdAt).toBeInstanceOf(Date);
    expect(insertReturn1.modifiedAt).toEqual(insertReturn1.createdAt);

    // test getting a user by ID
    const selection1 = await userRepo.getByID(insertReturn1.id);
    expect(selection1).not.toBeNull();
    expect(selection1!.id).toEqual(insertReturn1.id);
    expect(selection1!.displayName).toEqual(user1.displayName);
    expect(selection1!.email).toEqual(user1.email);
    expect(selection1!.userHandle).toEqual(user1.userHandle);
    expect(selection1!.lastLoginAt).toBeInstanceOf(Date);
    expect(selection1!.createdAt).toBeInstanceOf(Date);
    expect(selection1!.modifiedAt).toEqual(selection1!.createdAt);
    expect(selection1!.disabledAt).toBeNull();

    // test updating a user
    const originallyModifiedAt = selection1!.modifiedAt;
    await sleep(20);
    selection1!.displayName = toUserDisplayName("Jon Doe");
    selection1!.userHandle = toUserHandle("jd");

    const updateReturn2 = await userRepo.update(selection1!);
    expect(updateReturn2).toBe(true);
    expect(selection1!.modifiedAt.getTime()).toBeGreaterThan(
      originallyModifiedAt.getTime()
    );

    const selection2 = await userRepo.getByID(insertReturn1.id);
    expect(selection2).toEqual(selection1);

    // test checking for available handles

    let handleAvailable = await userRepo.isHandleAvailable("jd");
    expect(handleAvailable).toBe(false);
    handleAvailable = await userRepo.isHandleAvailable("jd2");
    expect(handleAvailable).toBe(true);

    // test that database complains if user handle not unique when adding user

    const badUser1A = User.castFrom({
      ...user1,
      displayName: "Jimmy Joe",
      email: "jjoe@xyz.pdq",
      userHandle: selection1!.userHandle,
    });
    const doAdd1 = () => userRepo.add(badUser1A);
    await expect(doAdd1()).rejects.toBeInstanceOf(DatabaseError);
    await expect(doAdd1()).rejects.toHaveProperty("code", PG_UNIQUE_VIOLATION);

    // test that database complains if email not unique when adding user

    const badUser1B = User.castFrom({
      ...user1,
      displayName: "Jimmy Joe",
      email: user1.email,
      userHandle: "jj",
    });
    const doAdd2 = () => userRepo.add(badUser1B);
    await expect(doAdd2()).rejects.toBeInstanceOf(DatabaseError);
    await expect(doAdd2()).rejects.toHaveProperty("code", PG_UNIQUE_VIOLATION);

    // test that database complains if user handle not unique when updating user

    const insertReturn2 = await userRepo.add(user2);
    insertReturn2!.userHandle = selection1!.userHandle;
    const doUpdate1 = () => userRepo.update(insertReturn2);
    await expect(doUpdate1()).rejects.toBeInstanceOf(DatabaseError);
    await expect(doUpdate1()).rejects.toHaveProperty(
      "code",
      PG_UNIQUE_VIOLATION
    );

    // test that database complains if email not unique when updating user

    insertReturn2!.userHandle = user2.userHandle;
    insertReturn2!.email = selection1!.email;
    const doUpdate2 = async () => userRepo.update(insertReturn2);
    await expect(doUpdate2()).rejects.toBeInstanceOf(DatabaseError);
    await expect(doUpdate2()).rejects.toHaveProperty(
      "code",
      PG_UNIQUE_VIOLATION
    );

    // test deleting a user

    const deleted = await userRepo.deleteByID(insertReturn1.id);
    expect(deleted).toBe(true);
    const selection5 = await userRepo.getByID(insertReturn1.id);
    expect(selection5).toBeNull();
  });

  it("reports whether user emails are verified", async () => {
    await resetTestDB();
    const userRepo = new UserRepo(db);
    const insertReturn1 = (await userRepo.add(user1))!;
    const insertReturn2 = (await userRepo.add(user2))!;

    const verified1 = await userRepo.isEmailVerified(insertReturn1.id);
    expect(verified1).toBe(true);

    const verified2 = await userRepo.isEmailVerified(insertReturn2.id);
    expect(verified2).toBe(false);
  });
});
