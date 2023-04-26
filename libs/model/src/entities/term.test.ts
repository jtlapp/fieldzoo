import { BASE64_UUID_LENGTH } from "@fieldzoo/base64-uuid";

import { Term } from "./term";

const maxNameLength = Term.schema.properties.name.maxLength!;
const minDescriptionLength = Term.schema.properties.description.minLength!;
const maxDescriptionLength = Term.schema.properties.description.maxLength!;
const SAMPLE_UUID = "X".repeat(BASE64_UUID_LENGTH);

describe("Term entity", () => {
  it("accepts valid terms", () => {
    expect(() =>
      Term.create({
        uuid: "",
        glossaryId: SAMPLE_UUID,
        name: "Good Name",
        description: "A".repeat(minDescriptionLength),
        updatedBy: 1,
      })
    ).not.toThrow();
    expect(() =>
      Term.create({
        uuid: SAMPLE_UUID,
        glossaryId: SAMPLE_UUID,
        name: "Good Name",
        description: "A".repeat(minDescriptionLength),
        updatedBy: 1,
      })
    ).not.toThrow();
    expect(() =>
      Term.create({
        uuid: SAMPLE_UUID,
        glossaryId: SAMPLE_UUID,
        name: "Good Name",
        description: "This\nis\nfine.",
        updatedBy: 1,
      })
    ).not.toThrow();
    expect(() =>
      Term.create({
        uuid: SAMPLE_UUID,
        glossaryId: SAMPLE_UUID,
        name: "A".repeat(maxNameLength),
        description: "A".repeat(maxDescriptionLength),
        updatedBy: 1,
      })
    ).not.toThrow();
  });

  it("rejects invalid term names", () => {
    expect(() =>
      Term.create({
        uuid: SAMPLE_UUID,
        glossaryId: SAMPLE_UUID,
        name: "",
        description: "This\nis\nfine.",
        updatedBy: 1,
      })
    ).toThrow("term");
    expect(() =>
      Term.create({
        uuid: SAMPLE_UUID,
        glossaryId: SAMPLE_UUID,
        name: "X  Y",
        description: "This\nis\nfine.",
        updatedBy: 1,
      })
    ).toThrow("term");
    expect(() =>
      Term.create({
        uuid: SAMPLE_UUID,
        glossaryId: SAMPLE_UUID,
        name: "A".repeat(maxNameLength + 1),
        description: "This\nis\nfine.",
        updatedBy: 1,
      })
    ).toThrow("term");
  });

  it("rejects invalid term descriptions", () => {
    expect(() =>
      Term.create({
        uuid: SAMPLE_UUID,
        glossaryId: SAMPLE_UUID,
        name: "Good Name",
        description: "",
        updatedBy: 1,
      })
    ).toThrow("term");
    expect(() =>
      Term.create({
        uuid: SAMPLE_UUID,
        glossaryId: SAMPLE_UUID,
        name: "Good Name",
        description: "\n\n",
        updatedBy: 1,
      })
    ).toThrow("term");
    expect(() =>
      Term.create({
        uuid: SAMPLE_UUID,
        glossaryId: SAMPLE_UUID,
        name: "Good Name",
        description: "A".repeat(maxDescriptionLength + 1),
        updatedBy: 1,
      })
    ).toThrow("term");
  });

  it("doesn't validate when assumed valid", () => {
    expect(() =>
      Term.create(
        {
          uuid: SAMPLE_UUID,
          glossaryId: SAMPLE_UUID,
          name: "",
          description: "",
          updatedBy: 1,
        },
        true
      )
    ).not.toThrow();
  });

  it("cannot be changed", () => {
    const term = Term.create({
      uuid: SAMPLE_UUID,
      glossaryId: SAMPLE_UUID,
      name: "X",
      description: "Good description",
      updatedBy: 1,
    });
    expect(() => ((term as any).uuid = "abc")).toThrow("read only");
  });
});
