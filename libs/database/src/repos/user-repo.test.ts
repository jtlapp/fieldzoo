import * as path from "path";
import { Pool } from "pg";
import {
  Kysely,
  PostgresDialect,
  // Selectable,
  // Insertable,
  // Updateable,
} from "kysely";
import * as dotenv from "dotenv";

import { DB_ENVVAR_PREFIX, TEST_ENV } from "@fieldzoo/app-config";
import { DatabaseConfig } from "@fieldzoo/database-config";
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

const USER1 = {
  name: "Jennifer",
  email: "jenn@xyz.com",
};

describe("user repo", () => {
  it("should work", async () => {
    await resetTestDB(db);
    const userRepo = new UserRepo(db);

    // Add a user
    const id = await userRepo.insert(USER1);

    // Verify that the user was added
    let user = await userRepo.findById(id);
    expect(user?.name).toEqual(USER1.name);
    expect(user?.email).toEqual(USER1.email);

    // Delete the user
    const deleted = await userRepo.deleteById(id);
    expect(deleted).toEqual(true);

    // Verify that the user was deleted
    user = await userRepo.findById(id);
    expect(user).toBeNull();

    // const selectableUser: Selectable<UserTable> = {
    //   id: 99,
    //   name: "foo",
    //   email: "br",
    // };
    // const insertableUser: Insertable<UserTable> = {
    //   id: undefined,
    //   name: "foo",
    //   email: "br",
    // };
    // const updateableUser: Updateable<UserTable> = {
    //   id: undefined,
    //   name: "foo",
    //   email: "br",
    // };
  });
});
