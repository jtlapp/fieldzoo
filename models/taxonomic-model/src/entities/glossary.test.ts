import { BASE64_UUID_LENGTH } from "@fieldzoo/base64-uuid";
import { UnvalidatedFields } from "@fieldzoo/generic-types";
import { testTimestamp } from "@fieldzoo/modeling/dist/testing";
import { testUserID } from "@fieldzoo/system-model";

import { Glossary } from "./glossary";
import { testGlossaryID } from "../values/glossary-id.test";
import { testDisplayName } from "../values/display-name.test";
import { testMultilineDescription } from "../values/multiline-description.test";
import { testVersionNumber } from "../values/version-number.test";

const SAMPLE_USER_ID = "ae19af00-af09-af09-af09-abcde129af00";
const SAMPLE_UUID = "X".repeat(BASE64_UUID_LENGTH);
const ERROR_MSG = "Invalid glossary";

describe("Glossary entity", () => {
  it("accepts only valid glossaries", () => {
    // TODO: revisit whether various castFrom() methods should always
    // allow ID to be falsy. Maybe do this after writing REST APIs.

    // undefined ID defaults to 0
    expect(() => createGlossary({ id: undefined })).not.toThrow();
    expect(() => createGlossary({ id: "" })).not.toThrow();
    testGlossaryID(
      ERROR_MSG,
      (id) => createGlossary({ id }),
      (skip) => [undefined, ""].includes(skip)
    );

    expect(() => createGlossary({ versionNumber: 0 })).not.toThrow();
    testVersionNumber(
      ERROR_MSG,
      (versionNumber) => createGlossary({ versionNumber }),
      (skip) => skip === 0
    );

    testUserID(ERROR_MSG, (ownerID) => createGlossary({ ownerID }));
    testUserID(ERROR_MSG, (modifiedBy) => createGlossary({ modifiedBy }));
    testDisplayName(ERROR_MSG, (name) => createGlossary({ name }));

    testMultilineDescription(
      ERROR_MSG,
      (description) => createGlossary({ description }),
      (skip) => skip === null
    );
    expect(() => createGlossary({ description: null })).not.toThrow();

    testTimestamp(
      ERROR_MSG,
      (createdAt) => createGlossary({ createdAt }),
      (skip) => skip === undefined
    );
    testTimestamp(
      ERROR_MSG,
      (modifiedAt) => createGlossary({ modifiedAt }),
      (skip) => skip === undefined
    );
  });

  it("doesn't validate when assumed valid", () => {
    expect(() =>
      Glossary.castFrom(
        {
          id: SAMPLE_UUID,
          versionNumber: 1,
          ownerID: SAMPLE_USER_ID,
          modifiedBy: SAMPLE_USER_ID,
          name: "",
          description: "",
        },
        false
      )
    ).not.toThrow();
  });

  it("cannot change id", () => {
    const glossary = Glossary.castFrom({
      id: SAMPLE_UUID,
      versionNumber: 1,
      ownerID: SAMPLE_USER_ID,
      modifiedBy: SAMPLE_USER_ID,
      name: "X",
      description: null,
    });
    expect(() => ((glossary as any).id = "XX")).toThrow("read only");
  });
});

function createGlossary(specifiedFields: Partial<UnvalidatedFields<Glossary>>) {
  return Glossary.castFrom({
    id: SAMPLE_UUID,
    versionNumber: 1,
    ownerID: SAMPLE_USER_ID,
    name: "Good Name",
    description: "This\nis\nfine.",
    modifiedBy: SAMPLE_USER_ID,
    ...(specifiedFields as any),
  });
}
