import { BASE64_UUID_LENGTH } from "@fieldzoo/base64-uuid";
import { UnvalidatedFields } from "@fieldzoo/generic-types";
import { testTimestamps } from "@fieldzoo/modeling";
import { testUserID } from "@fieldzoo/system-model";

import { Glossary } from "./glossary";
import { testGlossaryID } from "../values/glossary-id.test";
import { testDisplayName } from "../values/display-name.test";
import { testMultilineDescription } from "../values/multiline-description.test";
import { testVersionNumber } from "../values/version-number.test";

const SAMPLE_UUID = "X".repeat(BASE64_UUID_LENGTH);
const ERROR_MSG = "Invalid glossary";

describe("Glossary entity", () => {
  it("accepts only valid glossaries", () => {
    // TODO: revisit whether various castFrom() methods should always
    // allow ID to be falsy. Maybe do this after writing REST APIs.

    // undefined ID defaults to 0
    expect(() => createGlossary({ uuid: undefined })).not.toThrow();
    expect(() => createGlossary({ uuid: "" })).not.toThrow();
    testGlossaryID(
      ERROR_MSG,
      (uuid) => createGlossary({ uuid }),
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

    testTimestamps("Invalid glossary", (createdAt, modifiedAt) =>
      Glossary.castFrom({
        versionNumber: 1,
        ownerID: 1,
        modifiedBy: 1,
        name: "Good Name",
        description: "This\nis\nfine.",
        createdAt,
        modifiedAt,
      })
    );
  });

  it("doesn't validate when assumed valid", () => {
    expect(() =>
      Glossary.castFrom(
        {
          uuid: SAMPLE_UUID,
          versionNumber: 1,
          ownerID: 1,
          modifiedBy: 1,
          name: "",
          description: "",
        },
        false
      )
    ).not.toThrow();
  });

  it("cannot change id", () => {
    const glossary = Glossary.castFrom({
      versionNumber: 1,
      uuid: SAMPLE_UUID,
      ownerID: 1,
      modifiedBy: 1,
      name: "X",
      description: null,
    });
    expect(() => ((glossary as any).uuid = "XX")).toThrow("read only");
  });
});

function createGlossary(specifiedFields: Partial<UnvalidatedFields<Glossary>>) {
  return Glossary.castFrom({
    uuid: SAMPLE_UUID,
    versionNumber: 1,
    ownerID: 1,
    name: "Good Name",
    description: "This\nis\nfine.",
    modifiedBy: 1,
    ...(specifiedFields as any),
  });
}
