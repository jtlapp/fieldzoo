import * as path from "path";
import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";
import * as dotenv from "dotenv";

import { DB_ENVVAR_PREFIX, TEST_ENV } from "@fieldzoo/app-config";
import { DatabaseConfig } from "@fieldzoo/database-config";
import { User, UserNameImpl } from "@fieldzoo/model";

import { resetTestDB, sleep } from "../utils/database-testing";
import { Database } from "../tables/current-tables";
import { UserRepo } from "./user-repo";

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
  const insertedUser = User.castFrom({
    name: "John Doe",
    email: "jdoe@xyz.pdq",
  });
  expect(insertedUser.id).toEqual(0);
  expect(() => insertedUser.createdAt).toThrow("no creation date");
  expect(() => insertedUser.modifiedAt).toThrow("no modification date");

  // test updating a non-existent user
  const updateReturn1 = await userRepo.store(
    User.castFrom({ ...insertedUser, id: 1 })
  );
  expect(updateReturn1).toEqual(null);

  // test inserting a user
  const insertReturn = (await userRepo.store(insertedUser))!;
  expect(insertReturn).not.toBeNull();
  expect(insertReturn.id).toBeGreaterThan(0);
  expect(insertReturn.createdAt).toBeInstanceOf(Date);
  expect(insertReturn.modifiedAt).toEqual(insertReturn.createdAt);

  // test getting a user by ID
  const selection1 = await userRepo.getByID(insertReturn.id);
  expectEqualUsers(selection1, insertReturn);
  expect(selection1!.modifiedAt).toEqual(insertReturn.modifiedAt);

  // test updating a user
  await sleep(20);
  selection1!.name = UserNameImpl.castFrom("Jon Doe");

  const updateReturn = await userRepo.store(selection1!);
  expectEqualUsers(updateReturn, selection1!);
  expect(updateReturn?.modifiedAt.getTime()).toBeGreaterThan(
    selection1!.modifiedAt.getTime()
  );

  const selection2 = await userRepo.getByID(insertReturn.id);
  expectEqualUsers(selection2, updateReturn!);
  expect(selection2!.modifiedAt).toEqual(updateReturn!.modifiedAt);

  // test deleting a user
  const deleted = await userRepo.deleteByID(insertReturn.id);
  expect(deleted).toEqual(true);
  const selection3 = await userRepo.getByID(insertReturn.id);
  expect(selection3).toEqual(null);
});

function expectEqualUsers(actual: User | null, expected: User) {
  expect(actual).not.toBeNull();
  expect(actual!.id).toEqual(expected.id);
  expect(actual!.createdAt).toEqual(expected.createdAt);
}
