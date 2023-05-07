import { getTestDB, closeTestDB, resetTestDB, sleep } from "@fieldzoo/database";

import { User } from "../entities/user";
import { UserNameImpl } from "../values/user-name";

import { UserRepo } from "./user-repo";

const db = getTestDB();

afterAll(() => closeTestDB());

it("inserts, updates, and deletes users", async () => {
  await resetTestDB(db);
  const userRepo = new UserRepo(db);
  const insertedUser = User.castFrom({
    name: "John Doe",
    email: "jdoe@xyz.pdq",
    accessRevokedAt: null,
    passwordHash: null,
    passwordSalt: null,
  });
  expect(insertedUser.id).toEqual(0);
  expect(() => insertedUser.createdAt).toThrow("no creation date");
  expect(() => insertedUser.modifiedAt).toThrow("no modification date");

  // test updating a non-existent user
  const updateReturn1 = await userRepo.update(
    User.castFrom({
      ...insertedUser,
      id: 1,
      accessRevokedAt: null,
      passwordHash: null,
      passwordSalt: null,
    })
  );
  expect(updateReturn1).toBe(false);

  // test inserting a user
  const insertReturn = await userRepo.add(insertedUser);
  expect(insertReturn).not.toBeNull();
  expect(insertReturn.id).toBeGreaterThan(0);
  expect(insertReturn.createdAt).toBeInstanceOf(Date);
  expect(insertReturn.modifiedAt).toEqual(insertReturn.createdAt);

  // test getting a user by ID
  const selection1 = await userRepo.getByID(insertReturn.id);
  expectEqualUsers(selection1, insertReturn);

  // test updating a user
  const originallyModifiedAt = selection1!.modifiedAt;
  await sleep(20);
  selection1!.name = UserNameImpl.castFrom("Jon Doe");

  const updateReturn2 = await userRepo.update(selection1!);
  expect(updateReturn2).toBe(true);
  expect(selection1!.modifiedAt.getTime()).toBeGreaterThan(
    originallyModifiedAt.getTime()
  );

  const selection2 = await userRepo.getByID(insertReturn.id);
  expectEqualUsers(selection2, selection1!);

  // test deleting a user
  const deleted = await userRepo.deleteByID(insertReturn.id);
  expect(deleted).toBe(true);
  const selection3 = await userRepo.getByID(insertReturn.id);
  expect(selection3).toBeNull();
});

function expectEqualUsers(actual: User | null, expected: User) {
  expect(actual).not.toBeNull();
  expect(actual!.id).toEqual(expected.id);
  expect(actual!.createdAt).toEqual(expected.createdAt);
  expect(actual!.modifiedAt).toEqual(expected.modifiedAt);
}
