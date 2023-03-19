import * as path from "path";
import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";
import * as dotenv from "dotenv";

import { DB_ENVVAR_PREFIX, TEST_ENV } from "@fieldzoo/app-config";
import { DatabaseConfig } from "@fieldzoo/database-config";
import { User, UserID } from "@fieldzoo/model";

import { resetTestDB } from "../index";
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

  // test inserting a user
  const insertedUser = new User({
    id: 0 as UserID,
    name: "John Doe",
    email: "jdoe@xyz.pdq",
  });
  const insertReturn = await userRepo.store(insertedUser);
  expect(insertReturn.id).toBeGreaterThan(0);

  // test getting a user by ID
  const selectedUser1 = await userRepo.getByID(insertReturn.id);
  expect(selectedUser1).toEqual(insertReturn);
  expect(selectedUser1?.id).toEqual(insertReturn.id);

  // test updating a user
  const updaterUser = new User({
    ...selectedUser1!,
    name: "Jon Doe",
  });
  const updateReturn = await userRepo.store(updaterUser);
  expect(updateReturn).toEqual(updaterUser);
  const selectedUser2 = await userRepo.getByID(insertReturn.id);
  expect(selectedUser2).toEqual(updateReturn);

  // test deleting a user
  const deleted = await userRepo.deleteById(insertReturn.id);
  expect(deleted).toEqual(true);
  const selectedUser3 = await userRepo.getByID(insertReturn.id);
  expect(selectedUser3).toEqual(null);
});
