import * as path from "path";
import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";
import * as dotenv from "dotenv";

import { DB_ENVVAR_PREFIX, TEST_ENV } from "@fieldzoo/app-config";
import { BASE64_UUID_LENGTH } from "@fieldzoo/base64-uuid";
import { DatabaseConfig } from "@fieldzoo/database-config";
import { Glossary, User } from "@fieldzoo/model";

import { resetTestDB } from "../index";
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
  const userReturn = (await userRepo.store(insertedUser))!;

  const glossaryRepo = new GlossaryRepo(db);
  const insertedGlossary = Glossary.castFrom({
    name: "Test Glossary",
    description: "This is a test glossary",
    ownerId: userReturn.id,
    modifiedBy: userReturn.id,
  });

  // test updating a non-existent glossary
  const updateReturn1 = await glossaryRepo.store(
    Glossary.castFrom({
      ...insertedGlossary,
      uuid: SAMPLE_UUID,
    })
  );
  expect(updateReturn1).toEqual(null);

  // test inserting a glossary
  const insertReturn = (await glossaryRepo.store(insertedGlossary))!;
  expect(insertReturn).not.toBeNull();
  expect(insertReturn.uuid).not.toEqual("");

  // test getting a glossary by ID
  const selectedGlossary1 = await glossaryRepo.getByID(insertReturn.uuid);
  expect(selectedGlossary1).toEqual(insertReturn);

  // test updating a glossary
  const updaterGlossary = Glossary.castFrom({
    ...selectedGlossary1!,
    name: "Updated Glossary",
  });
  const updateReturn = await glossaryRepo.store(updaterGlossary);
  expect(updateReturn).toEqual(updaterGlossary);
  const selectedUser2 = await glossaryRepo.getByID(insertReturn.uuid);
  expect(selectedUser2).toEqual(updateReturn);

  // test deleting a glossary
  const deleted = await glossaryRepo.deleteByID(insertReturn.uuid);
  expect(deleted).toEqual(true);
  const selectedUser3 = await glossaryRepo.getByID(insertReturn.uuid);
  expect(selectedUser3).toEqual(null);
});
