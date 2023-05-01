import * as path from "path";
import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";
import * as dotenv from "dotenv";

import { DB_ENVVAR_PREFIX, TEST_ENV } from "@fieldzoo/app-config";
import { BASE64_UUID_LENGTH } from "@fieldzoo/base64-uuid";
import { DatabaseConfig } from "@fieldzoo/database-config";
import { DisplayNameImpl, Glossary, User } from "@fieldzoo/model";

import { resetTestDB, sleep } from "../utils/database-testing";
import { Database } from "../tables/current-tables";
import { UserRepo } from "./user-repo";
import { GlossaryRepo } from "./glossary-repo";

const PATH_TO_ROOT = path.join(__dirname, "../../../..");
const SAMPLE_UUID = "X".repeat(BASE64_UUID_LENGTH);

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

it("inserts, updates, and deletes glossaries", async () => {
  await resetTestDB(db);
  const userRepo = new UserRepo(db);
  const insertedUser = User.castFrom({
    name: "John Doe",
    email: "jdoe@xyz.pdq",
  });
  const userReturn = (await userRepo.add(insertedUser))!;

  const glossaryRepo = new GlossaryRepo(db);
  const insertedGlossary = Glossary.castFrom({
    name: "Test Glossary",
    description: "This is a test glossary",
    ownerID: userReturn.id,
    modifiedBy: userReturn.id,
  });

  // test updating a non-existent glossary
  const updateReturn1 = await glossaryRepo.update(
    Glossary.castFrom({
      ...insertedGlossary,
      uuid: SAMPLE_UUID,
    })
  );
  expect(updateReturn1).toBe(false);

  // test inserting a glossary
  const insertReturn = (await glossaryRepo.add(insertedGlossary))!;
  expect(insertReturn).not.toBeNull();
  expect(insertReturn.uuid).not.toEqual("");
  expect(insertReturn.createdAt).toBeInstanceOf(Date);
  expect(insertReturn.modifiedAt).toEqual(insertReturn.createdAt);

  // test getting a glossary by ID
  const selection1 = await glossaryRepo.getByID(insertReturn.uuid);
  expectEqualGlossaries(selection1, insertReturn);

  // test updating a glossary
  const originallyModifiedAt = selection1!.modifiedAt;
  await sleep(20);
  selection1!.name = DisplayNameImpl.castFrom("Updated Glossary");

  const updateReturn2 = await glossaryRepo.update(selection1!);
  expect(updateReturn2).toBe(true);
  expect(selection1!.modifiedAt.getTime()).toBeGreaterThan(
    originallyModifiedAt.getTime()
  );

  const selection2 = await glossaryRepo.getByID(insertReturn.uuid);
  expectEqualGlossaries(selection2, selection1!);

  // test deleting a glossary
  const deleted = await glossaryRepo.deleteByID(insertReturn.uuid);
  expect(deleted).toEqual(true);
  const selection3 = await glossaryRepo.getByID(insertReturn.uuid);
  expect(selection3).toEqual(null);
});

function expectEqualGlossaries(actual: Glossary | null, expected: Glossary) {
  expect(actual).not.toBeNull();
  expect(actual!.uuid).toEqual(expected.uuid);
  expect(actual!.createdAt).toEqual(expected.createdAt);
  expect(actual!.modifiedAt).toEqual(expected.modifiedAt);
}
