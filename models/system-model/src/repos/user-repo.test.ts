import {
  getTestDB,
  closeTestDB,
  resetTestDB,
  sleep,
  createSupabaseUser,
  updateSupabaseUser,
} from "@fieldzoo/database";

import { User } from "../entities/user";
import { UserNameImpl } from "../values/user-name";

import { UserRepo } from "./user-repo";
import { UserID } from "../values/user-id";
import { UserHandleImpl } from "../values/user-handle";
import { ValidationException } from "@fieldzoo/multitier-validator";

const db = getTestDB();

afterAll(() => closeTestDB());

it("inserts, updates, and deletes users", async () => {
  await resetTestDB();
  const userRepo = new UserRepo(db);
  const dummyUser = User.createFrom({
    id: "ae19af00-af09-af09-af09-abcde129af00",
    name: "John Doe",
    email: "jdoe1@xyz.pdq",
    handle: "jdoe",
    lastSignInAt: new Date(),
    bannedUntil: null,
    createdAt: new Date(),
    modifiedAt: new Date(),
    deletedAt: null,
  });
  const userID1 = (await createSupabaseUser(dummyUser.email)) as UserID;

  // test updating a non-existent user
  const updateReturn1 = await userRepo.update(dummyUser);
  expect(updateReturn1).toBe(false);

  // test that name/handle are initially null

  const selection0 = await userRepo.getByID(userID1);
  expect(selection0).not.toBeNull();
  expect(selection0!.id).toEqual(userID1);
  expect(selection0!.name).toBeNull();
  expect(selection0!.email).toEqual(dummyUser.email);
  expect(selection0!.handle).toBeNull();

  // test getting a user by ID
  const selection1 = await userRepo.getByID(userID1);
  expect(selection1).not.toBeNull();
  expect(selection1!.id).toEqual(userID1);
  expect(selection1!.name).toBeNull();
  expect(selection1!.email).toEqual(dummyUser.email);
  expect(selection1!.handle).toBeNull();
  expect(selection1!.lastSignInAt).toBeInstanceOf(Date);
  expect(selection1!.bannedUntil).toBeNull();
  expect(selection1!.createdAt).toBeInstanceOf(Date);
  expect(selection1!.modifiedAt).toEqual(selection1!.createdAt);
  expect(selection1!.deletedAt).toBeNull();

  // test directly updating a user
  let originallyModifiedAt = selection1!.modifiedAt;
  await sleep(20);
  selection1!.name = UserNameImpl.castFrom("Jon Doe");
  selection1!.handle = UserHandleImpl.castFrom("jd");

  const updateReturn2 = await userRepo.update(selection1!);
  expect(updateReturn2).toBe(true);
  expect(selection1!.modifiedAt.getTime()).toBeGreaterThan(
    originallyModifiedAt.getTime()
  );

  const selection2 = await userRepo.getByID(userID1);
  expect(selection2).toEqual(selection1);

  // test indirectly updating a user via Supabase
  const expectedUser = User.createFrom({
    ...selection1!,
    email: "jdoe2@xyz.pdq",
    createdAt: selection1!.createdAt,
    modifiedAt: selection1!.modifiedAt,
  });
  originallyModifiedAt = selection1!.modifiedAt;
  await sleep(20);
  await updateSupabaseUser(userID1, expectedUser.email);

  const selection3 = await userRepo.getByID(userID1);
  expect(selection3).toEqual(expectedUser);

  // test checking for available handles

  let handleAvailable = await userRepo.isHandleAvailable("jd");
  expect(handleAvailable).toBe(false);
  handleAvailable = await userRepo.isHandleAvailable("jd2");
  expect(handleAvailable).toBe(true);

  // test that database complains if handle not unique

  const userID2 = (await createSupabaseUser("q@d.qr")) as UserID;
  const selection4 = await userRepo.getByID(userID2);
  selection4!.handle = selection3!.handle;
  const doUpdate = () => userRepo.update(selection4!);
  await expect(doUpdate()).rejects.toThrow(ValidationException);
  await expect(doUpdate()).rejects.toThrow("handle is already in use");

  // test deleting a user
  const deleted = await userRepo.deleteByID(userID1);
  expect(deleted).toBe(true);
  const selection5 = await userRepo.getByID(userID1);
  expect(selection5).toBeNull();
});
