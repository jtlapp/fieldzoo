import { BASE64_UUID_LENGTH } from "@fieldzoo/base64-uuid";

import { testTimestamps } from "@fieldzoo/modeling";
import { testGlossaryID } from "../values/glossary-id.test";
import { UnvalidatedFields } from "@fieldzoo/generic-types";
import { testUserID } from "../values/user-id.test";
import { testDisplayName } from "../values/display-name.test";
import { testMultilineDescription } from "../values/multiline-description.test";
import { testVersionNumber } from "../values/version-number.test";
import { GlossaryVersion } from "./glossary-version";
import { testWhatChangedLine } from "../values/what-changed-line.test";

const SAMPLE_UUID = "X".repeat(BASE64_UUID_LENGTH);
const ERROR_MSG = "Invalid glossary version";

describe("GlossaryVersion entity", () => {
  it("accepts only valid glossary versions", () => {
    testGlossaryID(ERROR_MSG, (uuid) => createGlossaryVersion({ uuid }));
    testVersionNumber(ERROR_MSG, (version) =>
      createGlossaryVersion({ version })
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

    testTimestamps("Invalid glossary", (createdAt, modifiedAt) =>
      GlossaryVersion.castFrom({
        uuid: SAMPLE_UUID,
        version: 1,
        ownerID: 1,
        modifiedBy: 1,
        name: "Good Name",
        description: "This\nis\nfine.",
        createdAt: createdAt!,
        modifiedAt: modifiedAt!,
        whatChangedLine: "Description of what changed",
      })
    );

    testWhatChangedLine(ERROR_MSG, (whatChangedLine) =>
      createGlossaryVersion({ whatChangedLine })
    );
  });

  it("doesn't validate when assumed valid", () => {
    expect(() =>
      GlossaryVersion.castFrom(
        {
          uuid: SAMPLE_UUID,
          version: 1,
          ownerID: 1,
          modifiedBy: 1,
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
      uuid: SAMPLE_UUID,
      // TODO: rename version column to versionNumber to reduce confusion
      version: 1,
      ownerID: 1,
      modifiedBy: 1,
      name: "X",
      description: null,
      createdAt: new Date(),
      modifiedAt: new Date(),
      whatChangedLine: "Description of what changed",
    });
    expect(() => ((glossaryVersion as any).uuid = "XX")).toThrow("read only");
    expect(() => ((glossaryVersion as any).version = 100)).toThrow("read only");
    expect(() => ((glossaryVersion as any).description = "abc")).toThrow(
      "read only"
    );
  });
});

function createGlossaryVersion(
  specifiedFields: Partial<UnvalidatedFields<GlossaryVersion>>
) {
  return GlossaryVersion.castFrom({
    uuid: SAMPLE_UUID,
    version: 1,
    ownerID: 1,
    name: "Good Name",
    description: "This\nis\nfine.",
    modifiedBy: 1,
    createdAt: new Date(),
    modifiedAt: new Date(),
    whatChangedLine: "Description of what changed",
    ...(specifiedFields as any),
  });
}
