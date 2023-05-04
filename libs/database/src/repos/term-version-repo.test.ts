import * as path from "path";
import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";
import * as dotenv from "dotenv";

import { DB_ENVVAR_PREFIX, TEST_ENV } from "@fieldzoo/app-config";
import { DatabaseConfig } from "@fieldzoo/database-config";
import {
  Glossary,
  MultilineDescriptionImpl,
  Term,
  TermVersion,
  User,
} from "@fieldzoo/model";
import { WhatChangedLineImpl } from "@fieldzoo/model";
import { VersionNumberImpl } from "@fieldzoo/model";

import { resetTestDB, sleep } from "../utils/database-testing";
import { Database } from "../tables/table-interfaces";
import { UserRepo } from "./user-repo";
import { GlossaryRepo } from "./glossary-repo";
import { TermRepo } from "./term-repo";
import { TermVersionRepo, TermVersionSummary } from "./term-version-repo";

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

describe("TermVersionRepo", () => {
  it("inserts, selects, and deletes specific term versions", async () => {
    const termVersionRepo = new TermVersionRepo(db);
    const termVersions = await setupTest();

    // test inserting term versions
    for (const termVersion of termVersions) {
      const insertReturn = await termVersionRepo.add(termVersion);
      expect(insertReturn).toBeUndefined();
    }

    // test getting term versions by key
    const selection1 = await termVersionRepo.getByKey([
      termVersions[1].id,
      termVersions[1].versionNumber,
    ]);
    expect(selection1).toEqual(termVersions[1]);

    const selection2 = await termVersionRepo.getByKey([
      termVersions[2].id,
      termVersions[2].versionNumber,
    ]);
    expect(selection2).toEqual(termVersions[2]);

    // test deleting a term version
    const deleted = await termVersionRepo.deleteByTermID(termVersions[1].id);
    expect(deleted).toEqual(true);
    const selection3 = await termVersionRepo.getByKey([
      termVersions[1].id,
      termVersions[1].versionNumber,
    ]);
    expect(selection3).toBeNull();
  });

  it("gets term version summaries, which disappear on deletion", async () => {
    const termVersionRepo = new TermVersionRepo(db);
    const termVersions = await setupTest();
    for (const termVersion of termVersions) {
      await termVersionRepo.add(termVersion);
    }

    const expectedSummaries: TermVersionSummary[] = [
      {
        id: termVersions[1].id,
        versionNumber: termVersions[1].versionNumber,
        modifiedBy: termVersions[1].modifiedBy,
        modifiedAt: termVersions[1].modifiedAt,
        whatChangedLine: termVersions[1].whatChangedLine,
      },
      {
        id: termVersions[0].id,
        versionNumber: termVersions[0].versionNumber,
        modifiedBy: termVersions[0].modifiedBy,
        modifiedAt: termVersions[0].modifiedAt,
        whatChangedLine: termVersions[0].whatChangedLine,
      },
    ];

    // test getting first of multiple version summaries
    const summaries1 = await termVersionRepo.getSummaries(
      termVersions[0].id,
      0,
      1
    );
    expect(summaries1).toEqual([expectedSummaries[0]]);

    // test getting second of multiple version summaries
    const summaries2 = await termVersionRepo.getSummaries(
      termVersions[0].id,
      1,
      1
    );
    expect(summaries2).toEqual([expectedSummaries[1]]);

    // test getting all version summaries
    const summaries3 = await termVersionRepo.getSummaries(
      termVersions[0].id,
      0,
      100
    );
    expect(summaries3).toEqual(expectedSummaries);

    // test summaries disappearing on deleting a term version
    await termVersionRepo.deleteByTermID(termVersions[0].id);
    const summaries4 = await termVersionRepo.getSummaries(
      termVersions[0].id,
      0,
      100
    );
    expect(summaries4).toEqual([]);
  });

  async function setupTest() {
    await resetTestDB(db);
    const userRepo = new UserRepo(db);
    const insertedUser = User.castFrom({
      name: "John Doe",
      email: "jdoe@xyz.pdq",
    });
    const userReturn = (await userRepo.add(insertedUser))!;

    const glossaryRepo = new GlossaryRepo(db);
    const insertedGlossary = Glossary.castFrom({
      versionNumber: 1,
      name: "Test Glossary",
      description: "This is a test glossary",
      ownerID: userReturn.id,
      modifiedBy: userReturn.id,
    });
    const glossaryReturn = await glossaryRepo.add(insertedGlossary);

    const rawTerms = [
      {
        versionNumber: 0,
        displayName: "Term1",
        description: "This is test term 1",
        glossaryID: glossaryReturn!.uuid,
        modifiedBy: 1,
      },
      {
        versionNumber: 0,
        displayName: "Term2",
        description: "This is test term 2",
        glossaryID: glossaryReturn!.uuid,
        modifiedBy: 1,
      },
    ];

    const termRepo = new TermRepo(db);
    const terms: Term[] = [];
    for (const rawTerm of rawTerms) {
      terms.push(await termRepo.add(Term.castFrom(rawTerm)));
    }

    const termVersion1_1 = createTermVersion(terms[0], "What changed 1-1");
    await sleep(20);
    terms[0].versionNumber = VersionNumberImpl.castFrom(2);
    terms[0].description = MultilineDescriptionImpl.castFrom("Description 2");
    await termRepo.update(terms[0]);

    const termVersion1_2 = createTermVersion(terms[0], "What changed 1-2");
    const termVersion2_1 = createTermVersion(terms[1], "What changed 2-1");

    return [termVersion1_1, termVersion1_2, termVersion2_1];
  }
});

function createTermVersion(term: Term, whatChangedLine: string) {
  return TermVersion.castFrom({
    id: term.id,
    versionNumber: term.versionNumber,
    glossaryID: term.glossaryID,
    displayName: term.displayName,
    description: term.description,
    modifiedBy: term.modifiedBy,
    createdAt: term.createdAt,
    modifiedAt: term.modifiedAt,
    whatChangedLine: WhatChangedLineImpl.castFrom(whatChangedLine),
  });
}
