import {
  UserID,
  VersionNumberImpl,
  WhatChangedLineImpl,
} from "@fieldzoo/system-model";
import {
  getTestDB,
  closeTestDB,
  resetTestDB,
  sleep,
  createSupabaseUser,
} from "@fieldzoo/testing-utils";

import { Glossary } from "../entities/glossary";
import { GlossaryVersion } from "../entities/glossary-version";
import { MultilineDescriptionImpl } from "../values/multiline-description";
import { GlossaryRepo } from "./glossary-repo";
import {
  GlossaryVersionRepo,
  GlossaryVersionSummary,
} from "./glossary-version-repo";

const db = getTestDB();

afterAll(() => closeTestDB());

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
      glossaryVersions[1].glossaryID,
      glossaryVersions[1].versionNumber,
    ]);
    expect(selection1).toEqual(glossaryVersions[1]);

    const selection2 = await glossaryVersionRepo.getByKey([
      glossaryVersions[2].glossaryID,
      glossaryVersions[2].versionNumber,
    ]);
    expect(selection2).toEqual(glossaryVersions[2]);

    // test deleting a glossary version
    const deleted = await glossaryVersionRepo.deleteByGlossaryID(
      glossaryVersions[1].glossaryID
    );
    expect(deleted).toEqual(true);
    const selection3 = await glossaryVersionRepo.getByKey([
      glossaryVersions[1].glossaryID,
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
        glossaryID: glossaryVersions[1].glossaryID,
        versionNumber: glossaryVersions[1].versionNumber,
        modifiedBy: glossaryVersions[1].modifiedBy,
        modifiedAt: glossaryVersions[1].modifiedAt,
        whatChangedLine: glossaryVersions[1].whatChangedLine,
      },
      {
        glossaryID: glossaryVersions[0].glossaryID,
        versionNumber: glossaryVersions[0].versionNumber,
        modifiedBy: glossaryVersions[0].modifiedBy,
        modifiedAt: glossaryVersions[0].modifiedAt,
        whatChangedLine: glossaryVersions[0].whatChangedLine,
      },
    ];

    // test getting first of multiple version summaries
    const summaries1 = await glossaryVersionRepo.getSummaries(
      glossaryVersions[0].glossaryID,
      0,
      1
    );
    expect(summaries1).toEqual([expectedSummaries[0]]);

    // test getting second of multiple version summaries
    const summaries2 = await glossaryVersionRepo.getSummaries(
      glossaryVersions[0].glossaryID,
      1,
      1
    );
    expect(summaries2).toEqual([expectedSummaries[1]]);

    // test getting all version summaries
    const summaries3 = await glossaryVersionRepo.getSummaries(
      glossaryVersions[0].glossaryID,
      0,
      100
    );
    expect(summaries3).toEqual(expectedSummaries);

    // test summaries disappearing on deleting a glossary version
    await glossaryVersionRepo.deleteByGlossaryID(
      glossaryVersions[0].glossaryID
    );
    const summaries4 = await glossaryVersionRepo.getSummaries(
      glossaryVersions[0].glossaryID,
      0,
      100
    );
    expect(summaries4).toEqual([]);
  });

  async function setupTest() {
    await resetTestDB();
    const userID = (await createSupabaseUser("jdoe@xyz.pdq")) as UserID;

    const rawGlossaries = [
      {
        versionNumber: 0,
        ownerID: userID,
        name: "Glossary 1",
        description: "This is test glossary 1",
        modifiedBy: userID,
      },
      {
        versionNumber: 0,
        ownerID: userID,
        name: "Glossary 2",
        description: "This is test glossary 2",
        modifiedBy: userID,
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
    glossaryID: glossary.id,
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
