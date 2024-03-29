import { toDisplayName, toNormalizedName } from "@fieldzoo/general-model";
import { createTestUser } from "@fieldzoo/system-model/dist/test";
import {
  getTestDB,
  closeTestDB,
  resetTestDB,
  sleep,
} from "@fieldzoo/testing-utils";

import { Glossary } from "../entities/glossary";
import { Term } from "../entities/term";
import { GlossaryRepo } from "./glossary-repo";
import { TermRepo } from "./term-repo";

const db = getTestDB();

afterAll(() => closeTestDB());

test("inserts, updates, and deletes terms", async () => {
  await resetTestDB();
  const userID = (await createTestUser(db, "Jane Doe", "jdoe@xyz.pdq"))!.id;

  const glossaryRepo = new GlossaryRepo(db);
  const insertedGlossary = Glossary.castFrom({
    versionNumber: 1,
    name: "Test Glossary",
    description: "This is a test glossary",
    ownerID: userID,
    modifiedBy: userID,
  });
  const glossaryReturn = await glossaryRepo.add(insertedGlossary);

  const termRepo = new TermRepo(db);
  const insertedTerm = Term.castFrom({
    versionNumber: 0,
    displayName: "Test Term",
    description: "This is a test term",
    glossaryID: glossaryReturn!.id,
    modifiedBy: userID,
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
  expect(insertReturn.versionNumber).toEqual(1);
  expect(insertReturn.lookupName).toEqual(
    toNormalizedName(insertedTerm.displayName)
  );
  expect(insertReturn.createdAt).toBeInstanceOf(Date);
  expect(insertReturn.modifiedAt).toEqual(insertReturn.createdAt);

  // test getting a term by key
  const selection1 = await termRepo.getByKey([
    insertedTerm.glossaryID,
    insertedTerm.lookupName,
  ]);
  expectEqualTerms(selection1, insertReturn);

  // test updating a term
  const originallyModifiedAt = selection1!.modifiedAt;
  await sleep(20);
  selection1!.displayName = toDisplayName("Updated Term");

  const updateReturn2 = await termRepo.update(selection1!);
  expect(updateReturn2).toBe(true);
  expect(selection1!.versionNumber).toEqual(2);
  expect(selection1!.modifiedAt.getTime()).toBeGreaterThan(
    originallyModifiedAt.getTime()
  );

  const selection2 = await termRepo.getByKey([
    selection1!.glossaryID,
    selection1!.lookupName,
  ]);
  expectEqualTerms(selection2, selection1!);

  // test deleting a term
  const deleted = await termRepo.deleteByID(insertReturn.id);
  expect(deleted).toEqual(true);
  const selection3 = await termRepo.getByKey([
    selection1!.glossaryID,
    selection1!.lookupName,
  ]);
  expect(selection3).toBeNull();
});

function expectEqualTerms(actual: Term | null, expected: Term) {
  expect(actual).not.toBeNull();
  expect(actual!.id).toEqual(expected.id);
  expect(actual!.versionNumber).toEqual(expected.versionNumber);
  expect(actual!.displayName).toEqual(expected.displayName);
  expect(actual!.lookupName).toEqual(expected.lookupName);
  expect(actual!.modifiedAt).toEqual(expected.modifiedAt);
}
