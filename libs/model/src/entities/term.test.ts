import { BASE64_UUID_LENGTH } from "@fieldzoo/base64-uuid";

import { Term } from "./term";
import { NormalizedNameImpl } from "../values/normalized-name";
import { DisplayName } from "../values/display-name";
import { testTimestamps } from "@fieldzoo/modeling";

const maxNameLength = Term.schema.properties.displayName.maxLength!;
const minDescriptionLength = Term.schema.properties.description.minLength!;
const maxDescriptionLength = Term.schema.properties.description.maxLength!;
const SAMPLE_UUID = "X".repeat(BASE64_UUID_LENGTH);

// TODO: genericize the testing of values so code is reusable across entities

describe("Term entity", () => {
  it("accepts valid terms", () => {
    expect(() =>
      Term.castFrom({
        version: 1,
        glossaryID: SAMPLE_UUID,
        displayName: "Good Name",
        description: "This\nis\nfine.",
        modifiedBy: 1,
      })
    ).not.toThrow();
    expect(() =>
      Term.castFrom({
        version: 1,
        glossaryID: SAMPLE_UUID,
        lookupName: normalizeName("Good Name"),
        displayName: "Good Name",
        description: "A".repeat(minDescriptionLength),
        modifiedBy: 1,
      })
    ).not.toThrow();
    expect(() =>
      Term.castFrom({
        version: 1,
        glossaryID: SAMPLE_UUID,
        lookupName: "a".repeat(maxNameLength),
        displayName: "A".repeat(maxNameLength),
        description: "A".repeat(maxDescriptionLength),
        modifiedBy: 1,
      })
    ).not.toThrow();
    expect(() =>
      Term.castFrom({
        id: 1,
        version: 1,
        glossaryID: SAMPLE_UUID,
        lookupName: normalizeName("Good Name"),
        displayName: "Good Name",
        description: "A".repeat(minDescriptionLength),
        modifiedBy: 1,
      })
    ).not.toThrow();
  });

  it("rejects invalid term IDs", () => {
    expect(() =>
      Term.castFrom({
        id: 1.5,
        version: 1,
        glossaryID: SAMPLE_UUID,
        lookupName: normalizeName("Good Name"),
        displayName: "Good Name",
        description: "A".repeat(minDescriptionLength),
        modifiedBy: 1,
      })
    ).toThrow("term");

    expect(() =>
      Term.castFrom({
        id: -1,
        version: 1,
        glossaryID: SAMPLE_UUID,
        lookupName: normalizeName("Good Name"),
        displayName: "Good Name",
        description: "A".repeat(minDescriptionLength),
        modifiedBy: 1,
      })
    ).toThrow("term");
  });

  it("rejects invalid versions", () => {
    expect(() =>
      Term.castFrom({
        id: 1,
        version: 1.5,
        glossaryID: SAMPLE_UUID,
        lookupName: normalizeName("Good Name"),
        displayName: "Good Name",
        description: "A".repeat(minDescriptionLength),
        modifiedBy: 1,
      })
    ).toThrow("term");

    expect(() =>
      Term.castFrom({
        id: 1,
        version: -1,
        glossaryID: SAMPLE_UUID,
        lookupName: normalizeName("Good Name"),
        displayName: "Good Name",
        description: "A".repeat(minDescriptionLength),
        modifiedBy: 1,
      })
    ).toThrow("term");
  });

  it("rejects invalid glossary IDs", () => {
    expect(() =>
      Term.castFrom({
        version: 1,
        glossaryID: undefined!,
        lookupName: normalizeName("Good Name"),
        displayName: "Good Name",
        description: "This\nis\nfine.",
        modifiedBy: 1,
      })
    ).toThrow("term");
    expect(() =>
      Term.castFrom({
        version: 1,
        glossaryID: 999 as unknown as string,
        lookupName: normalizeName("Good Name"),
        displayName: "Good Name",
        description: "This\nis\nfine.",
        modifiedBy: 1,
      })
    ).toThrow("term");
    expect(() =>
      Term.castFrom({
        version: 1,
        glossaryID: "",
        lookupName: normalizeName("Good Name"),
        displayName: "Good Name",
        description: "This\nis\nfine.",
        modifiedBy: 1,
      })
    ).toThrow("term");
    expect(() =>
      Term.castFrom({
        version: 1,
        glossaryID: "too short",
        lookupName: normalizeName("Good Name"),
        displayName: "Good Name",
        description: "This\nis\nfine.",
        modifiedBy: 1,
      })
    ).toThrow("term");
    expect(() =>
      Term.castFrom({
        version: 1,
        glossaryID: SAMPLE_UUID + "too long",
        lookupName: normalizeName("Good Name"),
        displayName: "Good Name",
        description: "This\nis\nfine.",
        modifiedBy: 1,
      })
    ).toThrow("term");
  });

  it("rejects invalid lookup names", () => {
    expect(() =>
      Term.castFrom({
        version: 1,
        glossaryID: SAMPLE_UUID,
        lookupName: 999 as unknown as string,
        displayName: "Good Name",
        description: "This\nis\nfine.",
        modifiedBy: 1,
      })
    ).toThrow("term");
    expect(() =>
      Term.castFrom({
        version: 1,
        glossaryID: SAMPLE_UUID,
        lookupName: "",
        displayName: "Good Name",
        description: "This\nis\nfine.",
        modifiedBy: 1,
      })
    ).toThrow("term");
    expect(() =>
      Term.castFrom({
        version: 1,
        glossaryID: SAMPLE_UUID,
        lookupName: "food-name",
        displayName: "Good Name",
        description: "This\nis\nfine.",
        modifiedBy: 1,
      })
    ).toThrow("lookupName");
  });

  it("rejects invalid term names", () => {
    expect(() =>
      Term.castFrom({
        version: 1,
        glossaryID: SAMPLE_UUID,
        lookupName: normalizeName("Good Name"),
        displayName: "",
        description: "This\nis\nfine.",
        modifiedBy: 1,
      })
    ).toThrow("term");
    expect(() =>
      Term.castFrom({
        version: 1,
        glossaryID: SAMPLE_UUID,
        lookupName: normalizeName("Good Name"),
        displayName: "X  Y",
        description: "This\nis\nfine.",
        modifiedBy: 1,
      })
    ).toThrow("term");
    expect(() =>
      Term.castFrom({
        version: 1,
        glossaryID: SAMPLE_UUID,
        lookupName: normalizeName("Good Name"),
        displayName: "A".repeat(maxNameLength + 1),
        description: "This\nis\nfine.",
        modifiedBy: 1,
      })
    ).toThrow("term");
  });

  it("rejects invalid term descriptions", () => {
    expect(() =>
      Term.castFrom({
        version: 1,
        glossaryID: SAMPLE_UUID,
        lookupName: normalizeName("Good Name"),
        displayName: "Good Name",
        description: "",
        modifiedBy: 1,
      })
    ).toThrow("term");
    expect(() =>
      Term.castFrom({
        version: 1,
        glossaryID: SAMPLE_UUID,
        lookupName: normalizeName("Good Name"),
        displayName: "Good Name",
        description: "\n\n",
        modifiedBy: 1,
      })
    ).toThrow("term");
    expect(() =>
      Term.castFrom({
        version: 1,
        glossaryID: SAMPLE_UUID,
        lookupName: normalizeName("Good Name"),
        displayName: "Good Name",
        description: "A".repeat(maxDescriptionLength + 1),
        modifiedBy: 1,
      })
    ).toThrow("term");
  });

  it("accepts only valid timestamps", () => {
    testTimestamps("Invalid term", (createdAt, modifiedAt) =>
      Term.castFrom({
        version: 1,
        glossaryID: SAMPLE_UUID,
        displayName: "Good Name",
        description: "This\nis\nfine.",
        modifiedBy: 1,
        createdAt,
        modifiedAt,
      })
    );
  });

  it("doesn't validate when assumed valid", () => {
    expect(() =>
      Term.castFrom(
        {
          version: 1,
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
          version: 1,
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
    const term = Term.castFrom({
      version: 1,
      glossaryID: SAMPLE_UUID,
      lookupName: normalizeName("X"),
      displayName: "X",
      description: "Good description",
      modifiedBy: 1,
    });
    expect(() => ((term as any).id = 999)).toThrow("read only");
    expect(() => ((term as any).glossaryID = "abc")).toThrow("read only");
  });
});

function normalizeName(displayName: string) {
  return NormalizedNameImpl.castFrom(displayName as DisplayName);
}
