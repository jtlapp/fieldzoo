import { BASE64_UUID_LENGTH } from "@fieldzoo/base64-uuid";
import { testDate, testUUID } from "@fieldzoo/testing-utils";
import { UnvalidatedFields } from "@fieldzoo/generic-types";

import { testTermID } from "../values/term-id.test";
import { testVersionNumber } from "../values/version-number.test";
import { testGlossaryID } from "../values/glossary-id.test";
import { testDisplayName } from "../values/display-name.test";
import { testMultilineDescription } from "../values/multiline-description.test";
import { testWhatChangedLine } from "../values/what-changed-line.test";
import { TermVersion } from "./term-version";

const SAMPLE_USER_ID = "ae19af00-af09-af09-af09-abcde129af00";
const SAMPLE_UUID = "X".repeat(BASE64_UUID_LENGTH);

const ERROR_MSG = "Invalid term version";

describe("TermVersion entity", () => {
  it("accepts only valid term versions", () => {
    testTermID(ERROR_MSG, (termID) => createTermVersion({ termID }));
    testVersionNumber(ERROR_MSG, (versionNumber) =>
      createTermVersion({ versionNumber })
    );
    testGlossaryID(ERROR_MSG, (glossaryID) =>
      createTermVersion({ glossaryID })
    );
    testDisplayName(ERROR_MSG, (displayName) =>
      createTermVersion({ displayName })
    );
    testMultilineDescription(ERROR_MSG, (description) =>
      createTermVersion({ description })
    );
    testDate(
      ERROR_MSG,
      (createdAt) => createTermVersion({ createdAt }),
      (skip) => skip === undefined
    );
    testDate(
      ERROR_MSG,
      (modifiedAt) => createTermVersion({ modifiedAt }),
      (skip) => skip === undefined
    );
    testUUID(ERROR_MSG, (modifiedBy) => createTermVersion({ modifiedBy }));
    testWhatChangedLine(ERROR_MSG, (whatChangedLine) =>
      createTermVersion({ whatChangedLine })
    );
  });

  it("doesn't validate when assumed valid", () => {
    expect(() =>
      TermVersion.castFrom(
        {
          termID: 1,
          versionNumber: 1,
          glossaryID: SAMPLE_UUID,
          displayName: "",
          description: "",
          modifiedBy: SAMPLE_USER_ID,
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
    expect(() => ((term as any).termID = 999)).toThrow("read only");
    expect(() => ((term as any).glossaryID = "abc")).toThrow("read only");
    expect(() => ((term as any).description = "abc")).toThrow("read only");
  });
});

function createTermVersion(
  specifiedFields: Partial<UnvalidatedFields<TermVersion>>
) {
  return TermVersion.castFrom({
    termID: 1,
    versionNumber: 1,
    glossaryID: SAMPLE_UUID,
    displayName: "Good Name",
    description: "This\nis\nfine.",
    modifiedBy: SAMPLE_USER_ID,
    whatChangedLine: "Description of what changed",
    createdAt: new Date(),
    modifiedAt: new Date(),
    ...(specifiedFields as any),
  });
}
