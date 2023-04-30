import * as path from "path";
import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";
import * as dotenv from "dotenv";

import { DB_ENVVAR_PREFIX, TEST_ENV } from "@fieldzoo/app-config";
import { DatabaseConfig } from "@fieldzoo/database-config";
import { Glossary, Term, TermVersion, User } from "@fieldzoo/model";

import { resetTestDB } from "../utils/database-testing";
import { Database } from "../tables/current-tables";
import { UserRepo } from "./user-repo";
import { GlossaryRepo } from "./glossary-repo";
import { TermRepo } from "./term-repo";
import { TermVersionRepo } from "./term-version-repo";
import { WhatChangedLineeImpl } from "@fieldzoo/model/src/values/what-changed-line";

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

it("inserts, selects, and deletes term versions", async () => {
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
    ownerId: userReturn.id,
    modifiedBy: userReturn.id,
  });
  const glossaryReturn = await glossaryRepo.add(insertedGlossary);

  const termRepo = new TermRepo(db);
  const term = Term.castFrom({
    version: 0,
    displayName: "Test Term",
    description: "This is a test term",
    glossaryId: glossaryReturn!.uuid,
    modifiedBy: userReturn.id,
  });
  const termReturn = await termRepo.add(term);

  const termVersionRepo = new TermVersionRepo(db);
  const insertedVersion = new TermVersion(
    termReturn.id,
    term.version,
    term.glossaryId,
    term.displayName,
    term.description,
    term.modifiedBy,
    termReturn!.createdAt,
    termReturn!.modifiedAt,
    WhatChangedLineeImpl.castFrom("Changed the description")
  );

  // test inserting a term version
  const insertReturn = await termVersionRepo.add(insertedVersion);
  expect(insertReturn).toBeUndefined();

  // test getting a term version by key
  const selection1 = await termVersionRepo.getByKey([
    insertedVersion.id,
    insertedVersion.version,
  ]);
  expect(selection1).toEqual(insertedVersion);

  // test deleting a term version
  const deleted = await termVersionRepo.deleteByTermID(termReturn.id);
  expect(deleted).toEqual(true);
  const selection3 = await termVersionRepo.getByKey([
    insertedVersion.id,
    insertedVersion.version,
  ]);
  expect(selection3).toBeNull();
});
