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

    // DONE
    // Add a user
    const updatedUser = await userRepo.insertOne(USER1, ["id"]);

    // DONE
    // Verify that the user was added
    let user = await userRepo.selectById(updatedUser.id);
    expect(user?.name).toEqual(USER1.name);
    expect(user?.email).toEqual(USER1.email);

    // Verify find expression
    user = await userRepo.selectOne(["id", "=", updatedUser.id]);
    expect(user?.name).toEqual(USER1.name);
    expect(user?.email).toEqual(USER1.email);

    user = await userRepo.selectOne((qb) =>
      qb.where("id", "=", updatedUser.id)
    );

    let users = await userRepo.selectMany();
    expect(users?.length).toEqual(1);
    expect(user?.name).toEqual(USER1.name);
    expect(user?.email).toEqual(USER1.email);

    users = await userRepo.selectMany((qb) =>
      qb.where("id", "=", updatedUser.id)
    );
    expect(users?.length).toEqual(1);
    expect(users![0].name).toEqual(USER1.name);
    expect(users![0].email).toEqual(USER1.email);

    users = await userRepo.selectMany((qb) =>
      qb.offset(0).limit(1).where("id", "=", updatedUser.id)
    );
    expect(users?.length).toEqual(1);
    expect(users![0].name).toEqual(USER1.name);
    expect(users![0].email).toEqual(USER1.email);

    users = await userRepo.selectMany((qb) =>
      qb.where("id", "=", updatedUser.id)
    );
    expect(users?.length).toEqual(1);
    expect(users![0].name).toEqual(USER1.name);
    expect(users![0].email).toEqual(USER1.email);

    // DONE
    // Delete the user
    const deleted = await userRepo.deleteById(updatedUser.id);
    expect(deleted).toEqual(true);

    // DONE
    // Verify that the user was deleted
    user = await userRepo.selectById(updatedUser.id);
    expect(user).toBeNull();
  });
});

// interface notes
//
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
