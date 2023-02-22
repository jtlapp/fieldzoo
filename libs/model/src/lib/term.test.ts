import { Term, TermID } from "./term";
import { GlossaryID } from "./glossary";

const maxNameLength = Term.schema.properties.name.maxLength!;
const minDescriptionLength = Term.schema.properties.description.minLength!;
const maxDescriptionLength = Term.schema.properties.description.maxLength!;

describe("Term entity", () => {
  it("accepts valid terms", () => {
    expect(
      () =>
        new Term({
          id: "abc" as TermID,
          glossaryID: "def" as GlossaryID,
          name: "Good Name",
          description: "A".repeat(minDescriptionLength),
        }),
    ).not.toThrow();
    expect(
      () =>
        new Term({
          id: "abc" as TermID,
          glossaryID: "def" as GlossaryID,
          name: "Good Name",
          description: "This\nis\nfine.",
        }),
    ).not.toThrow();
    expect(
      () =>
        new Term({
          id: "abc" as TermID,
          glossaryID: "def" as GlossaryID,
          name: "A".repeat(maxNameLength),
          description: "A".repeat(maxDescriptionLength),
        }),
    ).not.toThrow();
  });

  it("rejects invalid term names", () => {
    expect(
      () =>
        new Term({
          id: "abc" as TermID,
          glossaryID: "def" as GlossaryID,
          name: "",
          description: "This\nis\nfine.",
        }),
    ).toThrow("term");
    expect(
      () =>
        new Term({
          id: "abc" as TermID,
          glossaryID: "def" as GlossaryID,
          name: "X  Y",
          description: "This\nis\nfine.",
        }),
    ).toThrow("term");
    expect(
      () =>
        new Term({
          id: "abc" as TermID,
          glossaryID: "def" as GlossaryID,
          name: "A".repeat(maxNameLength + 1),
          description: "This\nis\nfine.",
        }),
    ).toThrow("term");
  });

  it("rejects invalid term descriptions", () => {
    expect(
      () =>
        new Term({
          id: "abc" as TermID,
          glossaryID: "def" as GlossaryID,
          name: "Good Name",
          description: "",
        }),
    ).toThrow("term");
    expect(
      () =>
        new Term({
          id: "abc" as TermID,
          glossaryID: "def" as GlossaryID,
          name: "Good Name",
          description: "\n\n",
        }),
    ).toThrow("term");
    expect(
      () =>
        new Term({
          id: "abc" as TermID,
          glossaryID: "def" as GlossaryID,
          name: "Good Name",
          description: "A".repeat(maxDescriptionLength + 1),
        }),
    ).toThrow("term");
  });

  it("doesn't validate when assumed valid", () => {
    expect(
      () =>
        new Term(
          {
            id: "abc" as TermID,
            glossaryID: "def" as GlossaryID,
            name: "",
            description: "",
          },
          true,
        ),
    ).not.toThrow();
  });

  it("cannot be changed", () => {
    const term = new Term({
      id: "abc" as TermID,
      glossaryID: "def" as GlossaryID,
      name: "X",
      description: "Good description",
    });
    expect(() => ((term as any).id = "abc")).toThrow("read only");
  });
});
