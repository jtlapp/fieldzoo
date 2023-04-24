import { Glossary, GlossaryID } from "./glossary";
import { UserID } from "./user";

const maxNameLength = Glossary.schema.properties.name.maxLength!;
const maxDescriptionLength =
  Glossary.schema.properties.description.anyOf[0].maxLength!;

describe("Glossary entity", () => {
  it("accepts valid glossaries", () => {
    expect(
      () =>
        new Glossary({
          ownerId: 1 as UserID,
          updatedBy: 1 as UserID,
          name: "X",
          description: null,
        })
    ).not.toThrow();
    expect(
      () =>
        new Glossary({
          uuid: "" as GlossaryID,
          ownerId: 1 as UserID,
          updatedBy: 1 as UserID,
          name: "Good Name",
          description: "This\nis\nfine.",
        })
    ).not.toThrow();
    expect(
      () =>
        new Glossary({
          uuid: "abc" as GlossaryID,
          ownerId: 1 as UserID,
          updatedBy: 1 as UserID,
          name: "A".repeat(maxNameLength),
          description: "A".repeat(maxDescriptionLength),
        })
    ).not.toThrow();
  });

  it("rejects invalid glossary names", () => {
    expect(
      () =>
        new Glossary({
          uuid: "abc" as GlossaryID,
          ownerId: 1 as UserID,
          updatedBy: 1 as UserID,
          name: "",
          description: "This\nis\nfine.",
        })
    ).toThrow("Invalid glossary");
    expect(
      () =>
        new Glossary({
          uuid: "abc" as GlossaryID,
          ownerId: 1 as UserID,
          updatedBy: 1 as UserID,
          name: "X  Y",
          description: "This\nis\nfine.",
        })
    ).toThrow("Invalid glossary");
    expect(
      () =>
        new Glossary({
          uuid: "abc" as GlossaryID,
          ownerId: 1 as UserID,
          updatedBy: 1 as UserID,
          name: "A".repeat(maxNameLength + 1),
          description: "This\nis\nfine.",
        })
    ).toThrow("Invalid glossary");
  });

  it("rejects invalid glossary descriptions", () => {
    expect(
      () =>
        new Glossary({
          uuid: "abc" as GlossaryID,
          ownerId: 1 as UserID,
          updatedBy: 1 as UserID,
          name: "Good Name",
          description: "",
        })
    ).toThrow("Invalid glossary");
    expect(
      () =>
        new Glossary({
          uuid: "abc" as GlossaryID,
          ownerId: 1 as UserID,
          updatedBy: 1 as UserID,
          name: "Good Name",
          description: "\n\n",
        })
    ).toThrow("Invalid glossary");
    expect(
      () =>
        new Glossary({
          uuid: "abc" as GlossaryID,
          ownerId: 1 as UserID,
          updatedBy: 1 as UserID,
          name: "Good Name",
          description: "A".repeat(maxDescriptionLength + 1),
        })
    ).toThrow("Invalid glossary");
  });

  it("doesn't validate when assumed valid", () => {
    expect(
      () =>
        new Glossary(
          {
            uuid: "abc" as GlossaryID,
            ownerId: 1 as UserID,
            updatedBy: 1 as UserID,
            name: "",
            description: "",
          },
          true
        )
    ).not.toThrow();
  });

  it("cannot change id", () => {
    const glossary = new Glossary({
      uuid: "abc" as GlossaryID,
      ownerId: 1 as UserID,
      updatedBy: 1 as UserID,
      name: "X",
      description: null,
    });
    expect(() => ((glossary as any).uuid = "XX")).toThrow("read only");
  });
});
