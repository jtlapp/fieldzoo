import { BASE64_UUID_LENGTH } from "@fieldzoo/base64-uuid";
import { UserID } from "@fieldzoo/system-model";
import {
  getTestDB,
  closeTestDB,
  resetTestDB,
  sleep,
  createSupabaseUser,
} from "@fieldzoo/database";

import { DisplayNameImpl } from "../values/display-name";
import { Glossary } from "../entities/glossary";
import { GlossaryRepo } from "./glossary-repo";

const SAMPLE_UUID = "X".repeat(BASE64_UUID_LENGTH);

const db = getTestDB();

afterAll(() => closeTestDB());

it("inserts, updates, and deletes glossaries", async () => {
  await resetTestDB();
  const userID = (await createSupabaseUser("jdoe@xyz.pdq")) as UserID;

  const glossaryRepo = new GlossaryRepo(db);
  const insertedGlossary = Glossary.castFrom({
    versionNumber: 0,
    name: "Test Glossary",
    description: "This is a test glossary",
    ownerID: userID,
    modifiedBy: userID,
  });

  // test updating a non-existent glossary
  const updateReturn1 = await glossaryRepo.update(
    Glossary.castFrom({
      ...insertedGlossary,
      id: SAMPLE_UUID,
    })
  );
  expect(updateReturn1).toBe(false);

  // test inserting a glossary
  const insertReturn = (await glossaryRepo.add(insertedGlossary))!;
  expect(insertReturn).not.toBeNull();
  expect(insertReturn.id).not.toEqual("");
  expect(insertReturn.versionNumber).toEqual(1);
  expect(insertReturn.createdAt).toBeInstanceOf(Date);
  expect(insertReturn.modifiedAt).toEqual(insertReturn.createdAt);

  // test getting a glossary by ID
  const selection1 = await glossaryRepo.getByID(insertReturn.id);
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

  const selection2 = await glossaryRepo.getByID(insertReturn.id);
  expectEqualGlossaries(selection2, selection1!);

  // test deleting a glossary
  const deleted = await glossaryRepo.deleteByID(insertReturn.id);
  expect(deleted).toEqual(true);
  const selection3 = await glossaryRepo.getByID(insertReturn.id);
  expect(selection3).toEqual(null);
});

function expectEqualGlossaries(actual: Glossary | null, expected: Glossary) {
  expect(actual).not.toBeNull();
  expect(actual!.id).toEqual(expected.id);
  expect(actual!.createdAt).toEqual(expected.createdAt);
  expect(actual!.modifiedAt).toEqual(expected.modifiedAt);
}
