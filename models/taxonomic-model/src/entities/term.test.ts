import { BASE64_UUID_LENGTH } from "@fieldzoo/base64-uuid";
import { testTimestamp } from "@fieldzoo/modeling";
import { UnvalidatedFields } from "@fieldzoo/generic-types";
import { testUserID } from "@fieldzoo/system-model";

import { Term } from "./term";
import { NormalizedNameImpl } from "../values/normalized-name";
import { testTermID } from "../values/term-id.test";
import { testVersionNumber } from "../values/version-number.test";
import { testGlossaryID } from "../values/glossary-id.test";
import { testDisplayName } from "../values/display-name.test";
import { testMultilineDescription } from "../values/multiline-description.test";
import { DisplayNameImpl } from "../values/display-name";

const SAMPLE_UUID = "X".repeat(BASE64_UUID_LENGTH);

const ERROR_MSG = "Invalid term";

describe("Term entity", () => {
  it("accepts only valid terms", () => {
    // undefined ID defaults to 0
    expect(() => createTerm({ id: undefined })).not.toThrow();
    expect(() => createTerm({ id: 0 })).not.toThrow();
    testTermID(
      ERROR_MSG,
      (id) => createTerm({ id }),
      (skip) => [undefined, 0].includes(skip)
    );

    expect(() => createTerm({ versionNumber: 0 })).not.toThrow();
    testVersionNumber(
      ERROR_MSG,
      (versionNumber) => createTerm({ versionNumber }),
      (skip) => skip === 0
    );

    testGlossaryID(ERROR_MSG, (glossaryID) => createTerm({ glossaryID }));
    testDisplayName(ERROR_MSG, (displayName) => createTerm({ displayName }));

    testDisplayName(
      ERROR_MSG,
      (displayName) =>
        createTerm({
          displayName,
          lookupName: NormalizedNameImpl.castFrom(displayName),
        }),
      (skip) => typeof skip !== "string"
    );
    expect(() =>
      createTerm({
        lookupName: NormalizedNameImpl.castFrom(
          DisplayNameImpl.castFrom("Good Name")
        ),
      })
    ).not.toThrow();
    expect(() => createTerm({ lookupName: "wrong-name" })).toThrow(
      "inconsistent"
    );

    testMultilineDescription(ERROR_MSG, (description) =>
      createTerm({ description })
    );
    testTimestamp(
      ERROR_MSG,
      (createdAt) => createTerm({ createdAt }),
      (skip) => skip === undefined
    );
    testTimestamp(
      ERROR_MSG,
      (modifiedAt) => createTerm({ modifiedAt }),
      (skip) => skip === undefined
    );

    testUserID(ERROR_MSG, (modifiedBy) => createTerm({ modifiedBy }));
  });

  it("doesn't validate when assumed valid", () => {
    expect(() =>
      Term.castFrom(
        {
          versionNumber: 1,
          glossaryID: SAMPLE_UUID,
          lookupName: "",
          displayName: "",
          description: "",
          modifiedBy: 1,
        },
        false
      )
    ).not.toThrow();
    expect(() =>
      Term.castFrom(
        {
          versionNumber: 1,
          glossaryID: SAMPLE_UUID,
          lookupName: "foo",
          displayName: "bar",
          description: "valid",
          modifiedBy: 1,
        },
        false
      )
    ).not.toThrow();
  });

  it("cannot be changed", () => {
    const term = createTerm({});
    expect(() => ((term as any).id = 999)).toThrow("read only");
    expect(() => ((term as any).glossaryID = "abc")).toThrow("read only");
  });
});

function createTerm(specifiedFields: Partial<UnvalidatedFields<Term>>) {
  return Term.castFrom({
    versionNumber: 1,
    glossaryID: SAMPLE_UUID,
    displayName: "Good Name",
    description: "This\nis\nfine.",
    modifiedBy: 1,
    ...(specifiedFields as any),
  });
}
