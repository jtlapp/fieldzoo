import { BASE64_UUID_LENGTH } from "@fieldzoo/base64-uuid";

import { testTimestamps } from "@fieldzoo/modeling";
import { UnvalidatedFields } from "@fieldzoo/generic-types";
import { testTermID } from "../values/term-id.test";
import { testVersionNumber } from "../values/version-number.test";
import { testGlossaryID } from "../values/glossary-id.test";
import { testDisplayName } from "../values/display-name.test";
import { testMultilineDescription } from "../values/multiline-description.test";
import { testUserID } from "../values/user-id.test";
import { testWhatChangedLine } from "../values/what-changed-line.test";
import { TermVersion } from "./term-version";

const SAMPLE_UUID = "X".repeat(BASE64_UUID_LENGTH);

const ERROR_MSG = "Invalid term version";

describe("TermVersion entity", () => {
  it("accepts only valid term versions", () => {
    testTermID(ERROR_MSG, (id) => createTermVersion({ id }));
    testVersionNumber(ERROR_MSG, (version) => createTermVersion({ version }));
    testGlossaryID(ERROR_MSG, (glossaryID) =>
      createTermVersion({ glossaryID })
    );
    testDisplayName(ERROR_MSG, (displayName) =>
      createTermVersion({ displayName })
    );
    testMultilineDescription(ERROR_MSG, (description) =>
      createTermVersion({ description })
    );
    testTimestamps("Invalid term", (createdAt, modifiedAt) =>
      TermVersion.castFrom({
        id: 1,
        version: 1,
        glossaryID: SAMPLE_UUID,
        displayName: "Good Name",
        description: "This\nis\nfine.",
        modifiedBy: 1,
        createdAt: createdAt!,
        modifiedAt: modifiedAt!,
        whatChangedLine: "Description of what changed",
      })
    );
    testUserID(ERROR_MSG, (modifiedBy) => createTermVersion({ modifiedBy }));
    testWhatChangedLine(ERROR_MSG, (whatChangedLine) =>
      createTermVersion({ whatChangedLine })
    );
  });

  it("doesn't validate when assumed valid", () => {
    expect(() =>
      TermVersion.castFrom(
        {
          id: 1,
          version: 1,
          glossaryID: SAMPLE_UUID,
          displayName: "",
          description: "",
          modifiedBy: 1,
          whatChangedLine: null as any,
          createdAt: new Date(),
          modifiedAt: new Date(),
        },
        false
      )
    ).not.toThrow();
  });

  it("cannot be changed", () => {
    const term = createTermVersion({});
    expect(() => ((term as any).id = 999)).toThrow("read only");
    expect(() => ((term as any).glossaryID = "abc")).toThrow("read only");
    expect(() => ((term as any).description = "abc")).toThrow("read only");
  });
});

function createTermVersion(
  specifiedFields: Partial<UnvalidatedFields<TermVersion>>
) {
  return TermVersion.castFrom({
    id: 1,
    version: 1,
    glossaryID: SAMPLE_UUID,
    displayName: "Good Name",
    description: "This\nis\nfine.",
    modifiedBy: 1,
    whatChangedLine: "Description of what changed",
    createdAt: new Date(),
    modifiedAt: new Date(),
    ...(specifiedFields as any),
  });
}
