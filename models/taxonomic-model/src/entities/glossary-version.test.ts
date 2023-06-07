import { BASE64_UUID_LENGTH } from "@fieldzoo/base64-uuid";

import { testTimestamp } from "@fieldzoo/modeling/dist/testing";
import { UnvalidatedFields } from "@fieldzoo/generic-types";
import { testUserID } from "@fieldzoo/system-model";

import { testGlossaryID } from "../values/glossary-id.test";
import { testDisplayName } from "../values/display-name.test";
import { testMultilineDescription } from "../values/multiline-description.test";
import { testVersionNumber } from "../values/version-number.test";
import { GlossaryVersion } from "./glossary-version";
import { testWhatChangedLine } from "../values/what-changed-line.test";
import { Visibility } from "../values/visibility";

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
    testUserID(ERROR_MSG, (ownerID) => createGlossaryVersion({ ownerID }));
    testUserID(ERROR_MSG, (modifiedBy) =>
      createGlossaryVersion({ modifiedBy })
    );
    testDisplayName(ERROR_MSG, (name) => createGlossaryVersion({ name }));

    testMultilineDescription(
      ERROR_MSG,
      (description) => createGlossaryVersion({ description }),
      (skip) => skip === null
    );
    expect(() => createGlossaryVersion({ description: null })).not.toThrow();

    testTimestamp(
      ERROR_MSG,
      (createdAt) => createGlossaryVersion({ createdAt }),
      (skip) => skip === undefined
    );
    testTimestamp(
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
          visibility: -1 as any,
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
      visibility: Visibility.Private,
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
    visibility: Visibility.Private,
    modifiedBy: SAMPLE_USER_ID,
    createdAt: new Date(),
    modifiedAt: new Date(),
    whatChangedLine: "Description of what changed",
    ...(specifiedFields as any),
  });
}
