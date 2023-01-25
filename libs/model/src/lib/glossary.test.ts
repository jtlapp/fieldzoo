import {
  Glossary,
  GlossaryID,
  MAX_GLOSSARY_DESCRIPTION_LENGTH,
  MAX_GLOSSARY_NAME_LENGTH,
} from "./glossary";
import { UserID } from "./user";

describe("Glossary value object", () => {
  // The regex itself is already well tested elsewhere.

  it("accepts valid glosssaries", () => {
    expect(
      () =>
        new Glossary({
          id: "abc" as GlossaryID,
          ownerID: "def" as UserID,
          name: "X",
          description: null,
        })
    ).not.toThrow();
    expect(
      () =>
        new Glossary({
          id: "abc" as GlossaryID,
          ownerID: "def" as UserID,
          name: "Good Name",
          description: "This\nis\nfine.",
        })
    ).not.toThrow();
    expect(
      () =>
        new Glossary({
          id: "abc" as GlossaryID,
          ownerID: "def" as UserID,
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
          ownerID: "def" as UserID,
          name: "",
          description: "This\nis\nfine.",
        })
    ).toThrow("glossary");
    expect(
      () =>
        new Glossary({
          id: "abc" as GlossaryID,
          ownerID: "def" as UserID,
          name: "X  Y",
          description: "This\nis\nfine.",
        })
    ).toThrow("glossary");
    expect(
      () =>
        new Glossary({
          id: "abc" as GlossaryID,
          ownerID: "def" as UserID,
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
          ownerID: "def" as UserID,
          name: "Good Name",
          description: "",
        })
    ).toThrow("glossary");
    expect(
      () =>
        new Glossary({
          id: "abc" as GlossaryID,
          ownerID: "def" as UserID,
          name: "Good Name",
          description: "\n\n",
        })
    ).toThrow("glossary");
    expect(
      () =>
        new Glossary({
          id: "abc" as GlossaryID,
          ownerID: "def" as UserID,
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
            ownerID: "def" as UserID,
            name: "",
            description: "",
          },
          true
        )
    ).not.toThrow();
  });

  it("cannot be changed", () => {
    const glossary = new Glossary({
      id: "abc" as GlossaryID,
      ownerID: "def" as UserID,
      name: "X",
      description: null,
    });
    expect(() => ((glossary as any).name = "XX")).toThrow("read only");
    expect(() => ((glossary as any).description = "XX")).toThrow("read only");
  });
});
