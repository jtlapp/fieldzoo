import { BASE64_UUID_LENGTH } from "@fieldzoo/base64-uuid";

import { Term } from "./term";
import { NormalizedNameImpl } from "../values/normalized-name";
import { DisplayName } from "../values/display-name";

const maxNameLength = Term.schema.properties.displayName.maxLength!;
const minDescriptionLength = Term.schema.properties.description.minLength!;
const maxDescriptionLength = Term.schema.properties.description.maxLength!;
const SAMPLE_UUID = "X".repeat(BASE64_UUID_LENGTH);

describe("Term entity", () => {
  it("accepts valid terms", () => {
    expect(() =>
      Term.create({
        glossaryId: SAMPLE_UUID,
        lookupName: normalizeName("Good Name"),
        displayName: "Good Name",
        description: "A".repeat(minDescriptionLength),
        updatedBy: 1,
      })
    ).not.toThrow();
    expect(() =>
      Term.create({
        glossaryId: SAMPLE_UUID,
        lookupName: normalizeName("Good Name"),
        displayName: "Good Name",
        description: "This\nis\nfine.",
        updatedBy: 1,
      })
    ).not.toThrow();
    expect(() =>
      Term.create({
        glossaryId: SAMPLE_UUID,
        lookupName: "a".repeat(maxNameLength),
        displayName: "A".repeat(maxNameLength),
        description: "A".repeat(maxDescriptionLength),
        updatedBy: 1,
      })
    ).not.toThrow();
    expect(() =>
      Term.create({
        id: 1,
        glossaryId: SAMPLE_UUID,
        lookupName: normalizeName("Good Name"),
        displayName: "Good Name",
        description: "A".repeat(minDescriptionLength),
        updatedBy: 1,
      })
    ).not.toThrow();
  });

  it("rejects invalid term IDs", () => {
    expect(() =>
      Term.create({
        id: -1,
        glossaryId: SAMPLE_UUID,
        lookupName: normalizeName("Good Name"),
        displayName: "Good Name",
        description: "A".repeat(minDescriptionLength),
        updatedBy: 1,
      })
    ).toThrow("term");
  });

  it("rejects invalid glossary IDs", () => {
    expect(() =>
      Term.create({
        glossaryId: undefined!,
        lookupName: normalizeName("Good Name"),
        displayName: "Good Name",
        description: "This\nis\nfine.",
        updatedBy: 1,
      })
    ).toThrow("term");
    expect(() =>
      Term.create({
        glossaryId: 999 as unknown as string,
        lookupName: normalizeName("Good Name"),
        displayName: "Good Name",
        description: "This\nis\nfine.",
        updatedBy: 1,
      })
    ).toThrow("term");
    expect(() =>
      Term.create({
        glossaryId: "",
        lookupName: normalizeName("Good Name"),
        displayName: "Good Name",
        description: "This\nis\nfine.",
        updatedBy: 1,
      })
    ).toThrow("term");
    expect(() =>
      Term.create({
        glossaryId: "too short",
        lookupName: normalizeName("Good Name"),
        displayName: "Good Name",
        description: "This\nis\nfine.",
        updatedBy: 1,
      })
    ).toThrow("term");
    expect(() =>
      Term.create({
        glossaryId: SAMPLE_UUID + "too long",
        lookupName: normalizeName("Good Name"),
        displayName: "Good Name",
        description: "This\nis\nfine.",
        updatedBy: 1,
      })
    ).toThrow("term");
  });

  it("rejects invalid lookup names", () => {
    expect(() =>
      Term.create({
        glossaryId: SAMPLE_UUID,
        lookupName: undefined!,
        displayName: "Good Name",
        description: "This\nis\nfine.",
        updatedBy: 1,
      })
    ).toThrow("term");
    expect(() =>
      Term.create({
        glossaryId: SAMPLE_UUID,
        lookupName: 999 as unknown as string,
        displayName: "Good Name",
        description: "This\nis\nfine.",
        updatedBy: 1,
      })
    ).toThrow("term");
    expect(() =>
      Term.create({
        glossaryId: SAMPLE_UUID,
        lookupName: "",
        displayName: "Good Name",
        description: "This\nis\nfine.",
        updatedBy: 1,
      })
    ).toThrow("term");
  });

  it("rejects invalid term names", () => {
    expect(() =>
      Term.create({
        glossaryId: SAMPLE_UUID,
        lookupName: normalizeName("Good Name"),
        displayName: "",
        description: "This\nis\nfine.",
        updatedBy: 1,
      })
    ).toThrow("term");
    expect(() =>
      Term.create({
        glossaryId: SAMPLE_UUID,
        lookupName: normalizeName("Good Name"),
        displayName: "X  Y",
        description: "This\nis\nfine.",
        updatedBy: 1,
      })
    ).toThrow("term");
    expect(() =>
      Term.create({
        glossaryId: SAMPLE_UUID,
        lookupName: normalizeName("Good Name"),
        displayName: "A".repeat(maxNameLength + 1),
        description: "This\nis\nfine.",
        updatedBy: 1,
      })
    ).toThrow("term");
  });

  it("rejects invalid term descriptions", () => {
    expect(() =>
      Term.create({
        glossaryId: SAMPLE_UUID,
        lookupName: normalizeName("Good Name"),
        displayName: "Good Name",
        description: "",
        updatedBy: 1,
      })
    ).toThrow("term");
    expect(() =>
      Term.create({
        glossaryId: SAMPLE_UUID,
        lookupName: normalizeName("Good Name"),
        displayName: "Good Name",
        description: "\n\n",
        updatedBy: 1,
      })
    ).toThrow("term");
    expect(() =>
      Term.create({
        glossaryId: SAMPLE_UUID,
        lookupName: normalizeName("Good Name"),
        displayName: "Good Name",
        description: "A".repeat(maxDescriptionLength + 1),
        updatedBy: 1,
      })
    ).toThrow("term");
  });

  it("doesn't validate when assumed valid", () => {
    expect(() =>
      Term.create(
        {
          glossaryId: SAMPLE_UUID,
          lookupName: "",
          displayName: "",
          description: "",
          updatedBy: 1,
        },
        true
      )
    ).not.toThrow();
  });

  it("cannot be changed", () => {
    const term = Term.create({
      glossaryId: SAMPLE_UUID,
      lookupName: normalizeName("X"),
      displayName: "X",
      description: "Good description",
      updatedBy: 1,
    });
    expect(() => ((term as any).id = 999)).toThrow("read only");
    expect(() => ((term as any).glossaryId = "abc")).toThrow("read only");
  });
});

function normalizeName(displayName: string) {
  return NormalizedNameImpl.create(displayName as DisplayName);
}
