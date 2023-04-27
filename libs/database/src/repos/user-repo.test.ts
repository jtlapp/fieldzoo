import * as path from "path";
import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";
import * as dotenv from "dotenv";

import { DB_ENVVAR_PREFIX, TEST_ENV } from "@fieldzoo/app-config";
import { DatabaseConfig } from "@fieldzoo/database-config";
import { User } from "@fieldzoo/model";

import { resetTestDB, sleep } from "../utils/database-testing";
import { Database } from "../tables/current-tables";
import { UserRepo } from "./user-repo";
import { UserNameImpl } from "@fieldzoo/model";

const PATH_TO_ROOT = path.join(__dirname, "../../../..");

let db: Kysely<Database>;

beforeAll(() => {
  dotenv.config({ path: path.join(PATH_TO_ROOT, TEST_ENV) });
  db = new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new Pool(DatabaseConfig.fromEnv(DB_ENVVAR_PREFIX)),
    }),
  });
});

afterAll(() => db.destroy());

it("inserts, updates, and deletes users", async () => {
  await resetTestDB(db);
  const userRepo = new UserRepo(db);
  const insertedUser = User.create({
    name: "John Doe",
    email: "jdoe@xyz.pdq",
  });
  expect(insertedUser.id).toEqual(0);
  expect(() => insertedUser.createdAt).toThrow("no creation date");
  expect(() => insertedUser.modifiedAt).toThrow("no modification date");

  // test updating a non-existent user
  const updateReturn1 = await userRepo.store(
    User.create({ ...insertedUser, id: 1 })
  );
  expect(updateReturn1).toEqual(null);

  // test inserting a user
  const insertReturn = (await userRepo.store(insertedUser))!;
  expect(insertReturn).not.toBeNull();
  expect(insertReturn.id).toBeGreaterThan(0);
  expect(insertReturn.createdAt).toBeInstanceOf(Date);
  expect(insertReturn.modifiedAt).toEqual(insertReturn.createdAt);

  // test getting a user by ID
  const selectedUser1 = await userRepo.getByID(insertReturn.id);
  expectEqualUsers(selectedUser1, insertReturn);
  expect(selectedUser1!.modifiedAt).toEqual(insertReturn.modifiedAt);

  // test updating a user
  await sleep(20);
  selectedUser1!.name = UserNameImpl.create("Jon Doe");

  const updateReturn = await userRepo.store(selectedUser1!);
  expectEqualUsers(updateReturn, selectedUser1!);
  expect(updateReturn?.modifiedAt.getTime()).toBeGreaterThan(
    selectedUser1!.modifiedAt.getTime()
  );

  const selectedUser2 = await userRepo.getByID(insertReturn.id);
  expectEqualUsers(selectedUser2, updateReturn!);
  expect(selectedUser2!.modifiedAt).toEqual(updateReturn!.modifiedAt);

  // test deleting a user
  const deleted = await userRepo.deleteByID(insertReturn.id);
  expect(deleted).toEqual(true);
  const selectedUser3 = await userRepo.getByID(insertReturn.id);
  expect(selectedUser3).toEqual(null);
});

function expectEqualUsers(actual: User | null, expected: User) {
  expect(actual).not.toBeNull();
  expect(actual!.id).toEqual(expected.id);
  expect(actual!.createdAt).toEqual(expected.createdAt);
}
