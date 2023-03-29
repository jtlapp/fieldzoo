import { Term, TermID } from "./term";
import { GlossaryID } from "./glossary";
import { UserID } from "./user";

const maxNameLength = Term.schema.properties.name.maxLength!;
const minDescriptionLength = Term.schema.properties.description.minLength!;
const maxDescriptionLength = Term.schema.properties.description.maxLength!;

describe("Term entity", () => {
  it("accepts valid terms", () => {
    expect(
      () =>
        new Term({
          uuid: "abc" as TermID,
          glossaryId: "def" as GlossaryID,
          name: "Good Name",
          description: "A".repeat(minDescriptionLength),
          updatedBy: 1 as UserID,
        })
    ).not.toThrow();
    expect(
      () =>
        new Term({
          uuid: "abc" as TermID,
          glossaryId: "def" as GlossaryID,
          name: "Good Name",
          description: "This\nis\nfine.",
          updatedBy: 1 as UserID,
        })
    ).not.toThrow();
    expect(
      () =>
        new Term({
          uuid: "abc" as TermID,
          glossaryId: "def" as GlossaryID,
          name: "A".repeat(maxNameLength),
          description: "A".repeat(maxDescriptionLength),
          updatedBy: 1 as UserID,
        })
    ).not.toThrow();
  });

  it("rejects invalid term names", () => {
    expect(
      () =>
        new Term({
          uuid: "abc" as TermID,
          glossaryId: "def" as GlossaryID,
          name: "",
          description: "This\nis\nfine.",
          updatedBy: 1 as UserID,
        })
    ).toThrow("term");
    expect(
      () =>
        new Term({
          uuid: "abc" as TermID,
          glossaryId: "def" as GlossaryID,
          name: "X  Y",
          description: "This\nis\nfine.",
          updatedBy: 1 as UserID,
        })
    ).toThrow("term");
    expect(
      () =>
        new Term({
          uuid: "abc" as TermID,
          glossaryId: "def" as GlossaryID,
          name: "A".repeat(maxNameLength + 1),
          description: "This\nis\nfine.",
          updatedBy: 1 as UserID,
        })
    ).toThrow("term");
  });

  it("rejects invalid term descriptions", () => {
    expect(
      () =>
        new Term({
          uuid: "abc" as TermID,
          glossaryId: "def" as GlossaryID,
          name: "Good Name",
          description: "",
          updatedBy: 1 as UserID,
        })
    ).toThrow("term");
    expect(
      () =>
        new Term({
          uuid: "abc" as TermID,
          glossaryId: "def" as GlossaryID,
          name: "Good Name",
          description: "\n\n",
          updatedBy: 1 as UserID,
        })
    ).toThrow("term");
    expect(
      () =>
        new Term({
          uuid: "abc" as TermID,
          glossaryId: "def" as GlossaryID,
          name: "Good Name",
          description: "A".repeat(maxDescriptionLength + 1),
          updatedBy: 1 as UserID,
        })
    ).toThrow("term");
  });

  it("doesn't validate when assumed valid", () => {
    expect(
      () =>
        new Term(
          {
            uuid: "abc" as TermID,
            glossaryId: "def" as GlossaryID,
            name: "",
            description: "",
            updatedBy: 1 as UserID,
          },
          true
        )
    ).not.toThrow();
  });

  it("cannot be changed", () => {
    const term = new Term({
      uuid: "abc" as TermID,
      glossaryId: "def" as GlossaryID,
      name: "X",
      description: "Good description",
      updatedBy: 1 as UserID,
    });
    expect(() => ((term as any).uuid = "abc")).toThrow("read only");
  });
});
