import { BASE64_UUID_LENGTH } from "@fieldzoo/base64-uuid";
import { testDate, testUUID } from "@fieldzoo/testing-utils";
import { UnvalidatedFields } from "@fieldzoo/generic-types";
import {
  testDisplayName,
  testMultilineDescription,
} from "@fieldzoo/general-model/dist/test";
import {
  testVersionNumber,
  testWhatChangedLine,
} from "@fieldzoo/system-model/dist/test";

import { testGlossaryID } from "../values/glossary-id.test";
import { GlossaryVersion } from "./glossary-version";

const SAMPLE_USER_ID = "ae19af00-af09-af09-af09-abcde129af00";
const SAMPLE_UUID = "X".repeat(BASE64_UUID_LENGTH);
const ERROR_MSG = "Invalid glossary version";

describe("GlossaryVersion entity", () => {
  it("accepts only valid glossary versions", () => {
    testGlossaryID(ERROR_MSG, (glossaryID) =>
      createGlossaryVersion({ glossaryID })
    );
    testVersionNumber(ERROR_MSG, (versionNumber) =>
      createGlossaryVersion({ versionNumber })
    );
    testUUID(ERROR_MSG, (ownerID) => createGlossaryVersion({ ownerID }));
    testUUID(ERROR_MSG, (modifiedBy) => createGlossaryVersion({ modifiedBy }));
    testDisplayName(ERROR_MSG, (name) => createGlossaryVersion({ name }));

    testMultilineDescription(
      ERROR_MSG,
      (description) => createGlossaryVersion({ description }),
      (skip) => skip === null
    );
    expect(() => createGlossaryVersion({ description: null })).not.toThrow();

    testDate(
      ERROR_MSG,
      (createdAt) => createGlossaryVersion({ createdAt }),
      (skip) => skip === undefined
    );
    testDate(
      ERROR_MSG,
      (modifiedAt) => createGlossaryVersion({ modifiedAt }),
      (skip) => skip === undefined
    );

    testWhatChangedLine(ERROR_MSG, (whatChangedLine) =>
      createGlossaryVersion({ whatChangedLine })
    );
  });

  it("doesn't validate when assumed valid", () => {
    expect(() =>
      GlossaryVersion.castFrom(
        {
          glossaryID: SAMPLE_UUID,
          versionNumber: 1,
          ownerID: SAMPLE_USER_ID,
          modifiedBy: SAMPLE_USER_ID,
          name: "",
          description: "",
          createdAt: new Date(),
          modifiedAt: new Date(),
          whatChangedLine: 92 as any,
        },
        false
      )
    ).not.toThrow();
  });

  it("cannot modify", () => {
    const glossaryVersion = GlossaryVersion.castFrom({
      glossaryID: SAMPLE_UUID,
      versionNumber: 1,
      ownerID: SAMPLE_USER_ID,
      modifiedBy: SAMPLE_USER_ID,
      name: "X",
      description: null,
      createdAt: new Date(),
      modifiedAt: new Date(),
      whatChangedLine: "Description of what changed",
    });
    expect(() => ((glossaryVersion as any).glossaryID = "XX")).toThrow(
      "read only"
    );
    expect(() => ((glossaryVersion as any).versionNumber = 100)).toThrow(
      "read only"
    );
    expect(() => ((glossaryVersion as any).description = "abc")).toThrow(
      "read only"
    );
  });
});

function createGlossaryVersion(
  specifiedFields: Partial<UnvalidatedFields<GlossaryVersion>>
) {
  return GlossaryVersion.castFrom({
    glossaryID: SAMPLE_UUID,
    versionNumber: 1,
    ownerID: SAMPLE_USER_ID,
    name: "Good Name",
    description: "This\nis\nfine.",
    modifiedBy: SAMPLE_USER_ID,
    createdAt: new Date(),
    modifiedAt: new Date(),
    whatChangedLine: "Description of what changed",
    ...(specifiedFields as any),
  });
}
