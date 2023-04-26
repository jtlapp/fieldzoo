import * as path from "path";
import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";
import * as dotenv from "dotenv";

import { DB_ENVVAR_PREFIX, TEST_ENV } from "@fieldzoo/app-config";
import { DatabaseConfig } from "@fieldzoo/database-config";
import { BASE64_UUID_LENGTH, Glossary, Term, User } from "@fieldzoo/model";

import { resetTestDB } from "../index";
import { Database } from "../tables/current-tables";
import { UserRepo } from "./user-repo";
import { GlossaryRepo } from "./glossary-repo";
import { TermRepo } from "./term-repo";

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

it("inserts, updates, and deletes terms", async () => {
  await resetTestDB(db);
  const userRepo = new UserRepo(db);
  const insertedUser = User.create({
    name: "John Doe",
    email: "jdoe@xyz.pdq",
  });
  const userReturn = (await userRepo.store(insertedUser))!;

  const glossaryRepo = new GlossaryRepo(db);
  const insertedGlossary = Glossary.create({
    name: "Test Term",
    description: "This is a test term",
    ownerId: userReturn.id,
    updatedBy: userReturn.id,
  });
  const glossaryReturn = await glossaryRepo.store(insertedGlossary);

  const termRepo = new TermRepo(db);
  const insertedTerm = Term.create({
    name: "Test Term",
    description: "This is a test term",
    glossaryId: glossaryReturn!.uuid,
    updatedBy: userReturn.id,
  });

  // test updating a non-existent term
  const updateReturn1 = await termRepo.store(
    Term.create({
      ...insertedTerm,
      uuid: SAMPLE_UUID,
    })
  );
  expect(updateReturn1).toEqual(null);

  // test inserting a term
  const insertReturn = (await termRepo.store(insertedTerm))!;
  expect(insertReturn).not.toBeNull();
  expect(insertReturn.uuid).not.toEqual("");

  // test getting a term by ID
  const selectedTerm1 = await termRepo.getByID(insertReturn.uuid);
  expect(selectedTerm1).toEqual(insertReturn);

  // test updating a term
  const updaterTerm = Term.create({
    ...selectedTerm1!,
    name: "Updated Term",
  });
  const updateReturn = await termRepo.store(updaterTerm);
  expect(updateReturn).toEqual(updaterTerm);
  const selectedUser2 = await termRepo.getByID(insertReturn.uuid);
  expect(selectedUser2).toEqual(updateReturn);

  // test deleting a term
  const deleted = await termRepo.deleteById(insertReturn.uuid);
  expect(deleted).toEqual(true);
  const selectedUser3 = await termRepo.getByID(insertReturn.uuid);
  expect(selectedUser3).toEqual(null);
});
