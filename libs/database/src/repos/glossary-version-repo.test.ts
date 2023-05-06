import * as path from "path";
import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";
import * as dotenv from "dotenv";

import { TEST_ENV } from "@fieldzoo/app-config";
import { DatabaseConfig } from "@fieldzoo/database-config";
import {
  Glossary,
  MultilineDescriptionImpl,
  GlossaryVersion,
  User,
  showValuesDiagnostics,
} from "@fieldzoo/model";
import { WhatChangedLineImpl } from "@fieldzoo/model";
import { VersionNumberImpl } from "@fieldzoo/model";

import { resetTestDB, sleep } from "../utils/database-testing";
import { Database } from "../tables/table-interfaces";
import { UserRepo } from "./user-repo";
import { GlossaryRepo } from "./glossary-repo";
import {
  GlossaryVersionRepo,
  GlossaryVersionSummary,
} from "./glossary-version-repo";

const PATH_TO_ROOT = path.join(__dirname, "../../../..");

let db: Kysely<Database>;

showValuesDiagnostics(true);

beforeAll(() => {
  dotenv.config({ path: path.join(PATH_TO_ROOT, TEST_ENV) });
  db = new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new Pool(new DatabaseConfig()),
    }),
  });
});

afterAll(() => db.destroy());

describe("GlossaryVersionRepo", () => {
  it("inserts, selects, and deletes specific glossary versions", async () => {
    const glossaryVersionRepo = new GlossaryVersionRepo(db);
    const glossaryVersions = await setupTest();

    // test inserting glossary versions
    for (const glossaryVersion of glossaryVersions) {
      const insertReturn = await glossaryVersionRepo.add(glossaryVersion);
      expect(insertReturn).toBeUndefined();
    }

    // test getting glossary versions by key
    const selection1 = await glossaryVersionRepo.getByKey([
      glossaryVersions[1].uuid,
      glossaryVersions[1].versionNumber,
    ]);
    expect(selection1).toEqual(glossaryVersions[1]);

    const selection2 = await glossaryVersionRepo.getByKey([
      glossaryVersions[2].uuid,
      glossaryVersions[2].versionNumber,
    ]);
    expect(selection2).toEqual(glossaryVersions[2]);

    // test deleting a glossary version
    const deleted = await glossaryVersionRepo.deleteByGlossaryUUID(
      glossaryVersions[1].uuid
    );
    expect(deleted).toEqual(true);
    const selection3 = await glossaryVersionRepo.getByKey([
      glossaryVersions[1].uuid,
      glossaryVersions[1].versionNumber,
    ]);
    expect(selection3).toBeNull();
  });

  it("gets glossary version summaries, which disappear on deletion", async () => {
    const glossaryVersionRepo = new GlossaryVersionRepo(db);
    const glossaryVersions = await setupTest();
    for (const glossaryVersion of glossaryVersions) {
      await glossaryVersionRepo.add(glossaryVersion);
    }

    const expectedSummaries: GlossaryVersionSummary[] = [
      {
        uuid: glossaryVersions[1].uuid,
        versionNumber: glossaryVersions[1].versionNumber,
        modifiedBy: glossaryVersions[1].modifiedBy,
        modifiedAt: glossaryVersions[1].modifiedAt,
        whatChangedLine: glossaryVersions[1].whatChangedLine,
      },
      {
        uuid: glossaryVersions[0].uuid,
        versionNumber: glossaryVersions[0].versionNumber,
        modifiedBy: glossaryVersions[0].modifiedBy,
        modifiedAt: glossaryVersions[0].modifiedAt,
        whatChangedLine: glossaryVersions[0].whatChangedLine,
      },
    ];

    // test getting first of multiple version summaries
    const summaries1 = await glossaryVersionRepo.getSummaries(
      glossaryVersions[0].uuid,
      0,
      1
    );
    expect(summaries1).toEqual([expectedSummaries[0]]);

    // test getting second of multiple version summaries
    const summaries2 = await glossaryVersionRepo.getSummaries(
      glossaryVersions[0].uuid,
      1,
      1
    );
    expect(summaries2).toEqual([expectedSummaries[1]]);

    // test getting all version summaries
    const summaries3 = await glossaryVersionRepo.getSummaries(
      glossaryVersions[0].uuid,
      0,
      100
    );
    expect(summaries3).toEqual(expectedSummaries);

    // test summaries disappearing on deleting a glossary version
    await glossaryVersionRepo.deleteByGlossaryUUID(glossaryVersions[0].uuid);
    const summaries4 = await glossaryVersionRepo.getSummaries(
      glossaryVersions[0].uuid,
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

    const rawGlossaries = [
      {
        versionNumber: 0,
        ownerID: userReturn.id,
        name: "Glossary 1",
        description: "This is test glossary 1",
        modifiedBy: userReturn.id,
      },
      {
        versionNumber: 0,
        ownerID: userReturn.id,
        name: "Glossary 2",
        description: "This is test glossary 2",
        modifiedBy: userReturn.id,
      },
    ];

    const glossaryRepo = new GlossaryRepo(db);
    const glossaries: Glossary[] = [];
    for (const rawGlossary of rawGlossaries) {
      glossaries.push(await glossaryRepo.add(Glossary.castFrom(rawGlossary)));
    }

    const glossaryVersion1_1 = createGlossaryVersion(
      glossaries[0],
      "What changed 1-1"
    );
    await sleep(20);
    glossaries[0].versionNumber = VersionNumberImpl.castFrom(2);
    glossaries[0].description =
      MultilineDescriptionImpl.castFrom("Description 2");
    await glossaryRepo.update(glossaries[0]);

    const glossaryVersion1_2 = createGlossaryVersion(
      glossaries[0],
      "What changed 1-2"
    );
    const glossaryVersion2_1 = createGlossaryVersion(
      glossaries[1],
      "What changed 2-1"
    );

    return [glossaryVersion1_1, glossaryVersion1_2, glossaryVersion2_1];
  }
});

function createGlossaryVersion(glossary: Glossary, whatChangedLine: string) {
  return GlossaryVersion.castFrom({
    uuid: glossary.uuid,
    versionNumber: glossary.versionNumber,
    ownerID: glossary.ownerID,
    name: glossary.name,
    description: glossary.description,
    modifiedBy: glossary.modifiedBy,
    createdAt: glossary.createdAt,
    modifiedAt: glossary.modifiedAt,
    whatChangedLine: WhatChangedLineImpl.castFrom(whatChangedLine),
  });
}
