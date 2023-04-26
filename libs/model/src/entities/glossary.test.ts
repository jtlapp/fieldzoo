import { Glossary } from "./glossary";

const maxNameLength = Glossary.schema.properties.name.maxLength!;
const maxDescriptionLength =
  Glossary.schema.properties.description.anyOf[0].maxLength!;

describe("Glossary entity", () => {
  it("accepts valid glossaries", () => {
    expect(() =>
      Glossary.create({
        ownerId: 1,
        updatedBy: 1,
        name: "X",
        description: null,
      })
    ).not.toThrow();
    expect(() =>
      Glossary.create({
        uuid: "",
        ownerId: 1,
        updatedBy: 1,
        name: "Good Name",
        description: "This\nis\nfine.",
      })
    ).not.toThrow();
    expect(() =>
      Glossary.create({
        uuid: "abc",
        ownerId: 1,
        updatedBy: 1,
        name: "A".repeat(maxNameLength),
        description: "A".repeat(maxDescriptionLength),
      })
    ).not.toThrow();
  });

  it("rejects invalid glossary names", () => {
    expect(() =>
      Glossary.create({
        uuid: "abc",
        ownerId: 1,
        updatedBy: 1,
        name: "",
        description: "This\nis\nfine.",
      })
    ).toThrow("Invalid glossary");
    expect(() =>
      Glossary.create({
        uuid: "abc",
        ownerId: 1,
        updatedBy: 1,
        name: "X  Y",
        description: "This\nis\nfine.",
      })
    ).toThrow("Invalid glossary");
    expect(() =>
      Glossary.create({
        uuid: "abc",
        ownerId: 1,
        updatedBy: 1,
        name: "A".repeat(maxNameLength + 1),
        description: "This\nis\nfine.",
      })
    ).toThrow("Invalid glossary");
  });

  it("rejects invalid glossary descriptions", () => {
    expect(() =>
      Glossary.create({
        uuid: "abc",
        ownerId: 1,
        updatedBy: 1,
        name: "Good Name",
        description: "",
      })
    ).toThrow("Invalid glossary");
    expect(() =>
      Glossary.create({
        uuid: "abc",
        ownerId: 1,
        updatedBy: 1,
        name: "Good Name",
        description: "\n\n",
      })
    ).toThrow("Invalid glossary");
    expect(() =>
      Glossary.create({
        uuid: "abc",
        ownerId: 1,
        updatedBy: 1,
        name: "Good Name",
        description: "A".repeat(maxDescriptionLength + 1),
      })
    ).toThrow("Invalid glossary");
  });

  it("doesn't validate when assumed valid", () => {
    expect(() =>
      Glossary.create(
        {
          uuid: "abc",
          ownerId: 1,
          updatedBy: 1,
          name: "",
          description: "",
        },
        true
      )
    ).not.toThrow();
  });

  it("cannot change id", () => {
    const glossary = Glossary.create({
      uuid: "abc",
      ownerId: 1,
      updatedBy: 1,
      name: "X",
      description: null,
    });
    expect(() => ((glossary as any).uuid = "XX")).toThrow("read only");
  });
});
