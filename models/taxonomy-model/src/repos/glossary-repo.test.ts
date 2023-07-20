import { BASE64_UUID_LENGTH } from "@fieldzoo/base64-uuid";
import { DisplayNameImpl } from "@fieldzoo/general-model";
import { UserID } from "@fieldzoo/system-model";
import {
  getTestDB,
  closeTestDB,
  resetTestDB,
  sleep,
  createSupabaseUser,
} from "@fieldzoo/testing-utils";

import { Glossary } from "../entities/glossary";
import { GlossaryRepo } from "./glossary-repo";
// import { VersionNumber } from "../values/version-number.js";
// import { MultilineDescription } from "../values/multiline-description";
// import { GlossaryID } from "../values/glossary-id";
// import { Permissions } from "../values/permissions";

const SAMPLE_UUID = "X".repeat(BASE64_UUID_LENGTH);

const db = getTestDB();

afterAll(() => closeTestDB());

describe("GlossaryRepo", () => {
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

  it("sets and gets user glossary permissions", async () => {
    // await resetTestDB();
    // const userID1 = (await createSupabaseUser("user1@abc.com")) as UserID;
    // // const userID2 = (await createSupabaseUser("user2@abc.com")) as UserID;
    // const glossaryRepo = new GlossaryRepo(db);
    // const glossary1 = await glossaryRepo.add(
    //   new Glossary(
    //     "" as GlossaryID,
    //     0 as VersionNumber,
    //     userID1,
    //     "User 1's Glossary" as DisplayName,
    //     "some description" as MultilineDescription,
    //     userID1
    //   )
    // );
    // const glossary2 = await glossaryRepo.add(
    //   new Glossary(
    //     "" as GlossaryID,
    //     0 as VersionNumber,
    //     userID2,
    //     "User 2's Glossary" as DisplayName,
    //     "some description" as MultilineDescription,
    //     Visibility.Private,
    //     userID2
    //   )
    // );
    // Ensure each user has admin access to their own glossary but
    // no access to the other user's glossary.
    // const glossaryPermissions = await glossaryRepo.getByIDWithPermissions(
    //   glossary1.id,
    //   userID1
    // );
    // expect(glossaryPermissions).toEqual({
    //   glossary: glossary1,
    //   permissions: Permissions.Admin,
    // });
  });

  function expectEqualGlossaries(actual: Glossary | null, expected: Glossary) {
    expect(actual).not.toBeNull();
    expect(actual!.id).toEqual(expected.id);
    expect(actual!.createdAt).toEqual(expected.createdAt);
    expect(actual!.modifiedAt).toEqual(expected.modifiedAt);
  }
});
