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

const db = getTestDB();

afterAll(() => closeTestDB());

it("inserts, updates, and deletes users", async () => {
  await resetTestDB(db);
  const userRepo = new UserRepo(db);
  const dummyUser = User.createFrom({
    id: "ae19af00-af09-af09-af09-abcde129af00",
    name: "John Doe",
    email: "jdoe@xyz.pdq",
    handle: "jdoe",
    lastSignInAt: new Date(),
    bannedUntil: null,
    createdAt: new Date(),
    modifiedAt: new Date(),
    deletedAt: null,
  });
  const userID = (await createSupabaseUser(dummyUser.email)) as UserID;

  // test updating a non-existent user
  const updateReturn1 = await userRepo.update(dummyUser);
  expect(updateReturn1).toBe(false);

  // TODO: test that name/handle are initially null

  // TODO: test that PG complains if handle not unique

  // test getting a user by ID
  const selection1 = await userRepo.getByID(userID);
  expect(selection1).not.toBeNull();
  expect(selection1!.id).toEqual(userID);
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

  const selection2 = await userRepo.getByID(userID);
  expect(selection2).toEqual(selection1);

  // test indirectly updating a user
  const expectedUser = User.createFrom({
    ...selection1!,
    email: "jd@abc.def",
    createdAt: selection1!.createdAt,
    modifiedAt: selection1!.modifiedAt,
  });
  originallyModifiedAt = selection1!.modifiedAt;
  await sleep(20);
  await updateSupabaseUser(userID, expectedUser.email);

  const selection3 = await userRepo.getByID(userID);
  expect(selection3).toEqual(expectedUser);

  // test deleting a user
  const deleted = await userRepo.deleteByID(userID);
  expect(deleted).toBe(true);
  const selection4 = await userRepo.getByID(userID);
  expect(selection4).toBeNull();
});
