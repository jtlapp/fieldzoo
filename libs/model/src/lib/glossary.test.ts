import {
  Glossary,
  GlossaryID,
  MAX_GLOSSARY_DESCRIPTION_LENGTH,
  MAX_GLOSSARY_NAME_LENGTH,
} from "./glossary";

describe("Glossary value object", () => {
  // The regex itself is already well tested elsewhere.

  it("accepts valid glossaries", () => {
    expect(
      () =>
        new Glossary({
          id: "abc" as GlossaryID,
          name: "X",
          description: null,
        })
    ).not.toThrow();
    expect(
      () =>
        new Glossary({
          id: "abc" as GlossaryID,
          name: "Good Name",
          description: "This\nis\nfine.",
        })
    ).not.toThrow();
    expect(
      () =>
        new Glossary({
          id: "abc" as GlossaryID,
          name: "A".repeat(MAX_GLOSSARY_NAME_LENGTH),
          description: "A".repeat(MAX_GLOSSARY_DESCRIPTION_LENGTH),
        })
    ).not.toThrow();
  });

  it("rejects invalid glossary names", () => {
    expect(
      () =>
        new Glossary({
          id: "abc" as GlossaryID,
          name: "",
          description: "This\nis\nfine.",
        })
    ).toThrow("glossary");
    expect(
      () =>
        new Glossary({
          id: "abc" as GlossaryID,
          name: "X  Y",
          description: "This\nis\nfine.",
        })
    ).toThrow("glossary");
    expect(
      () =>
        new Glossary({
          id: "abc" as GlossaryID,
          name: "A".repeat(MAX_GLOSSARY_NAME_LENGTH + 1),
          description: "This\nis\nfine.",
        })
    ).toThrow("glossary");
  });

  it("rejects invalid glossary descriptions", () => {
    expect(
      () =>
        new Glossary({
          id: "abc" as GlossaryID,
          name: "Good Name",
          description: "",
        })
    ).toThrow("glossary");
    expect(
      () =>
        new Glossary({
          id: "abc" as GlossaryID,
          name: "Good Name",
          description: "\n\n",
        })
    ).toThrow("glossary");
    expect(
      () =>
        new Glossary({
          id: "abc" as GlossaryID,
          name: "Good Name",
          description: "A".repeat(MAX_GLOSSARY_DESCRIPTION_LENGTH + 1),
        })
    ).toThrow("glossary");
  });

  it("doesn't validate when assumed valid", () => {
    expect(
      () =>
        new Glossary(
          {
            id: "abc" as GlossaryID,
            name: "",
            description: "",
          },
          true
        )
    ).not.toThrow();
  });

  it("cannot change id", () => {
    const glossary = new Glossary({
      id: "abc" as GlossaryID,
      name: "X",
      description: null,
    });
    expect(() => ((glossary as any).id = "XX")).toThrow("read only");
  });
});
