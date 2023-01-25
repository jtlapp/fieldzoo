import {
  MULTI_LINE_UNICODE_REGEX,
  SINGLE_LINE_UNICODE_REGEX,
  USER_NAME_REGEX,
} from "./regexes";

describe("SINGLE_LINE_UNICODE_REGEX", () => {
  const regex = SINGLE_LINE_UNICODE_REGEX;

  it("accepts valid text", () => {
    expect(matches("M", regex)).toBe(true);
    expect(matches("Jimmy", regex)).toBe(true);
    expect(matches("Mary Q.", regex)).toBe(true);
    expect(matches("abc d e fgh*32 + 1 <25> [!]'\" {,}", regex)).toBe(true);
    expect(matches("Mark Heüße", regex)).toBe(true);
  });

  it("rejects invalid text", () => {
    expect(matches("", regex)).toBe(false);
    expect(matches("\n", regex)).toBe(false);
    expect(matches("  ", regex)).toBe(false);
    expect(matches("X  Y", regex)).toBe(false);
    expect(matches(" Xy", regex)).toBe(false);
    expect(matches("Xy ", regex)).toBe(false);
    expect(matches("X\n", regex)).toBe(false);
    expect(matches("X\nY", regex)).toBe(false);
    expect(matches("X\tY", regex)).toBe(false);
  });
});

describe("MULTI_LINE_UNICODE_REGEX", () => {
  const regex = MULTI_LINE_UNICODE_REGEX;

  it("accepts valid text", () => {
    expect(matches("M", regex)).toBe(true);
    expect(matches("Jimmy", regex)).toBe(true);
    expect(matches("Mary Q.", regex)).toBe(true);
    expect(matches("abc d e fgh*32 + 1 <25> [!]'\" {,}", regex)).toBe(true);
    expect(matches("Mark Heüße", regex)).toBe(true);
    expect(matches("X  Y", regex)).toBe(true);
    expect(matches("X\nY", regex)).toBe(true);
    expect(matches("X \n Y", regex)).toBe(true);
    expect(matches("X\n\nY\nZ", regex)).toBe(true);
  });

  it("rejects invalid text", () => {
    expect(matches("", regex)).toBe(false);
    expect(matches("\n", regex)).toBe(false);
    expect(matches("  ", regex)).toBe(false);
    expect(matches(" Xy", regex)).toBe(false);
    expect(matches("Xy ", regex)).toBe(false);
    expect(matches("X\n", regex)).toBe(false);
    expect(matches("X\tY", regex)).toBe(false);
  });
});

describe("USER_NAME_REGEX", () => {
  const regex = USER_NAME_REGEX;

  it("accepts valid user names", () => {
    expect(matches("M", regex)).toBe(true);
    expect(matches("Mo", regex)).toBe(true);
    expect(matches("Jimmy", regex)).toBe(true);
    expect(matches("Mary Q.", regex)).toBe(true);
    expect(matches("Mary Q. Reacher", regex)).toBe(true);
    expect(matches("Mary Q. R. Baxter", regex)).toBe(true);
    expect(matches("Mary Q.R. Baxter", regex)).toBe(true);
    expect(matches("M.Q.R. Baxter", regex)).toBe(true);
    expect(matches("Mike O'Brien", regex)).toBe(true);
    expect(matches("Mary-Sue Blue-Green", regex)).toBe(true);
    expect(matches("Mary-Sue B.-Green", regex)).toBe(true);
    expect(matches("Mark Heüße", regex)).toBe(true);
  });

  it("rejects invalid user names", () => {
    expect(matches("", regex)).toBe(false);
    expect(matches(" M", regex)).toBe(false);
    expect(matches("M ", regex)).toBe(false);
    expect(matches("M.", regex)).toBe(false);
    expect(matches("X..Y", regex)).toBe(false);
    expect(matches("X  Y", regex)).toBe(false);
    expect(matches("X--Y", regex)).toBe(false);
    expect(matches(". Foo", regex)).toBe(false);
    expect(matches("-Foo", regex)).toBe(false);
    expect(matches("Mooo ", regex)).toBe(false);
    expect(matches("'Foo", regex)).toBe(false);
    expect(matches("Mike 'Brien", regex)).toBe(false);
    expect(matches("foo@abc.com", regex)).toBe(false);
    expect(matches("x/y", regex)).toBe(false);
  });
});

function matches(testString: string, regex: RegExp): boolean {
  return testString.match(regex) !== null;
}
