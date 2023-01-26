import {
  Term,
  TermID,
  MIN_TERM_DESCRIPTION_LENGTH,
  MAX_TERM_DESCRIPTION_LENGTH,
  MAX_TERM_NAME_LENGTH,
} from "./term";
import { UserID } from "./user";

describe("Term value object", () => {
  // The regex itself is already well tested elsewhere.

  it("accepts valid terms", () => {
    expect(
      () =>
        new Term({
          id: "abc" as TermID,
          ownerID: "def" as UserID,
          name: "Good Name",
          description: "A".repeat(MIN_TERM_DESCRIPTION_LENGTH),
        })
    ).not.toThrow();
    expect(
      () =>
        new Term({
          id: "abc" as TermID,
          ownerID: "def" as UserID,
          name: "Good Name",
          description: "This\nis\nfine.",
        })
    ).not.toThrow();
    expect(
      () =>
        new Term({
          id: "abc" as TermID,
          ownerID: "def" as UserID,
          name: "A".repeat(MAX_TERM_NAME_LENGTH),
          description: "A".repeat(MAX_TERM_DESCRIPTION_LENGTH),
        })
    ).not.toThrow();
  });

  it("rejects invalid term names", () => {
    expect(
      () =>
        new Term({
          id: "abc" as TermID,
          ownerID: "def" as UserID,
          name: "",
          description: "This\nis\nfine.",
        })
    ).toThrow("term");
    expect(
      () =>
        new Term({
          id: "abc" as TermID,
          ownerID: "def" as UserID,
          name: "X  Y",
          description: "This\nis\nfine.",
        })
    ).toThrow("term");
    expect(
      () =>
        new Term({
          id: "abc" as TermID,
          ownerID: "def" as UserID,
          name: "A".repeat(MAX_TERM_NAME_LENGTH + 1),
          description: "This\nis\nfine.",
        })
    ).toThrow("term");
  });

  it("rejects invalid term descriptions", () => {
    expect(
      () =>
        new Term({
          id: "abc" as TermID,
          ownerID: "def" as UserID,
          name: "Good Name",
          description: "",
        })
    ).toThrow("term");
    expect(
      () =>
        new Term({
          id: "abc" as TermID,
          ownerID: "def" as UserID,
          name: "Good Name",
          description: "\n\n",
        })
    ).toThrow("term");
    expect(
      () =>
        new Term({
          id: "abc" as TermID,
          ownerID: "def" as UserID,
          name: "Good Name",
          description: "A".repeat(MAX_TERM_DESCRIPTION_LENGTH + 1),
        })
    ).toThrow("term");
  });

  it("doesn't validate when assumed valid", () => {
    expect(
      () =>
        new Term(
          {
            id: "abc" as TermID,
            ownerID: "def" as UserID,
            name: "",
            description: "",
          },
          true
        )
    ).not.toThrow();
  });

  it("cannot be changed", () => {
    const term = new Term({
      id: "abc" as TermID,
      ownerID: "def" as UserID,
      name: "X",
      description: "Good description",
    });
    expect(() => ((term as any).name = "XX")).toThrow("read only");
    expect(() => ((term as any).description = "XX")).toThrow("read only");
  });
});