import * as path from "path";
import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";
import * as dotenv from "dotenv";

import { DB_ENVVAR_PREFIX, TEST_ENV } from "@fieldzoo/app-config";
import { DatabaseConfig } from "@fieldzoo/database-config";
import {
  DisplayNameImpl,
  Glossary,
  NormalizedNameImpl,
  Term,
  User,
} from "@fieldzoo/model";

import { resetTestDB, sleep } from "../utils/database-testing";
import { Database } from "../tables/current-tables";
import { UserRepo } from "./user-repo";
import { GlossaryRepo } from "./glossary-repo";
import { TermRepo } from "./term-repo";

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

it("inserts, updates, and deletes terms", async () => {
  await resetTestDB(db);
  const userRepo = new UserRepo(db);
  const insertedUser = User.castFrom({
    name: "John Doe",
    email: "jdoe@xyz.pdq",
  });
  const userReturn = (await userRepo.add(insertedUser))!;

  const glossaryRepo = new GlossaryRepo(db);
  const insertedGlossary = Glossary.castFrom({
    name: "Test Term",
    description: "This is a test term",
    ownerId: userReturn.id,
    modifiedBy: userReturn.id,
  });
  const glossaryReturn = await glossaryRepo.add(insertedGlossary);

  const termRepo = new TermRepo(db);
  const insertedTerm = Term.castFrom({
    version: 0,
    displayName: "Test Term",
    description: "This is a test term",
    glossaryId: glossaryReturn!.uuid,
    modifiedBy: userReturn.id,
  });

  // test updating a non-existent term
  const updateReturn1 = await termRepo.update(
    Term.castFrom({
      ...insertedTerm,
      id: 999,
      displayName: insertedTerm.displayName,
    })
  );
  expect(updateReturn1).toBe(false);

  // test inserting a term
  const insertReturn = await termRepo.add(insertedTerm);
  expect(insertReturn).not.toBeNull();
  expect(insertReturn.id).not.toEqual(0);
  expect(insertReturn.version).toEqual(1);
  expect(insertReturn.lookupName).toEqual(
    NormalizedNameImpl.castFrom(insertedTerm.displayName)
  );
  expect(insertReturn.createdAt).toBeInstanceOf(Date);
  expect(insertReturn.modifiedAt).toEqual(insertReturn.createdAt);

  // test getting a term by key
  const selection1 = await termRepo.getByKey([
    insertedTerm.glossaryId,
    insertedTerm.lookupName,
  ]);
  expectEqualTerms(selection1, insertReturn);

  // test updating a term
  const originallyModifiedAt = selection1!.modifiedAt;
  await sleep(20);
  selection1!.displayName = DisplayNameImpl.castFrom("Updated Term");

  const updateReturn2 = await termRepo.update(selection1!);
  expect(updateReturn2).toBe(true);
  expect(selection1!.version).toEqual(2);
  expect(selection1!.modifiedAt.getTime()).toBeGreaterThan(
    originallyModifiedAt.getTime()
  );

  const selection2 = await termRepo.getByKey([
    selection1!.glossaryId,
    selection1!.lookupName,
  ]);
  expectEqualTerms(selection2, selection1!);

  // test deleting a term
  const deleted = await termRepo.deleteByID(insertReturn.id);
  expect(deleted).toEqual(true);
  const selection3 = await termRepo.getByKey([
    selection1!.glossaryId,
    selection1!.lookupName,
  ]);
  expect(selection3).toBeNull();
});

function expectEqualTerms(actual: Term | null, expected: Term) {
  expect(actual).not.toBeNull();
  expect(actual!.id).toEqual(expected.id);
  expect(actual!.version).toEqual(expected.version);
  expect(actual!.displayName).toEqual(expected.displayName);
  expect(actual!.lookupName).toEqual(expected.lookupName);
  expect(actual!.modifiedAt).toEqual(expected.modifiedAt);
}
