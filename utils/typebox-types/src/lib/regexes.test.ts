import {
  CODE_WORD_REGEX,
  HEX_REGEX,
  HOST_NAME_REGEX,
  LOCALHOST_URL_REGEX,
  MULTI_LINE_UNICODE_REGEX,
  SINGLE_LINE_UNICODE_REGEX,
  USER_HANDLE_REGEX,
  USER_DISPLAY_NAME_UNICODE_REGEX,
} from "./regexes.js";

describe("CODE_WORD_REGEX", () => {
  const regex = CODE_WORD_REGEX;

  it("accepts valid text", () => {
    expect(matches("a", regex)).toBe(true);
    expect(matches("A", regex)).toBe(true);
    expect(matches("_", regex)).toBe(true);
    expect(matches("abc", regex)).toBe(true);
    expect(matches("ABC", regex)).toBe(true);
    expect(matches("Abc", regex)).toBe(true);
    expect(matches("abCdef", regex)).toBe(true);
    expect(matches("a_b", regex)).toBe(true);
    expect(matches("_", regex)).toBe(true);
    expect(matches("__", regex)).toBe(true);
    expect(matches("abc_", regex)).toBe(true);
    expect(matches("a1", regex)).toBe(true);
    expect(matches("_1", regex)).toBe(true);
    expect(matches("_1abc", regex)).toBe(true);
    expect(matches("abc123", regex)).toBe(true);
  });

  it("rejects invalid text", () => {
    expect(matches("", regex)).toBe(false);
    expect(matches("Gü", regex)).toBe(false);
    expect(matches("123", regex)).toBe(false);
    expect(matches("123abc", regex)).toBe(false);
    expect(matches("abc-def", regex)).toBe(false);
    expect(matches("*!", regex)).toBe(false);
    expect(matches("abc!", regex)).toBe(false);
  });
});

describe("HEX_REGEX", () => {
  const regex = HEX_REGEX;

  it("accepts valid text", () => {
    expect(matches("0", regex)).toBe(true);
    expect(matches("1", regex)).toBe(true);
    expect(matches("a", regex)).toBe(true);
    expect(matches("A", regex)).toBe(true);
    expect(matches("09AF", regex)).toBe(true);
  });

  it("rejects invalid text", () => {
    expect(matches("", regex)).toBe(false);
    expect(matches("G", regex)).toBe(false);
    expect(matches("g", regex)).toBe(false);
    expect(matches("09AG", regex)).toBe(false);
    expect(matches(" 09af", regex)).toBe(false);
  });
});

describe("HOST_NAME_REGEX", () => {
  const regex = HOST_NAME_REGEX;

  it("accepts valid text", () => {
    expect(matches("localhost", regex)).toBe(true);
    expect(matches("foo.com", regex)).toBe(true);
    expect(matches("foo.bar.com", regex)).toBe(true);
    expect(matches("foo-bar.foo-bar.co", regex)).toBe(true);
    expect(matches("foo123.foo-123.co", regex)).toBe(true);
  });

  it("rejects invalid text", () => {
    expect(matches("", regex)).toBe(false);
    expect(matches(".com", regex)).toBe(false);
    expect(matches("foo.", regex)).toBe(false);
    expect(matches("foo..bar", regex)).toBe(false);
    expect(matches("foo foo.com", regex)).toBe(false);
    expect(matches("foo.foo com", regex)).toBe(false);
    expect(matches("foo!com", regex)).toBe(false);
  });
});

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

describe("LOCALHOST_URL_REGEX", () => {
  const regex = LOCALHOST_URL_REGEX;

  it("accepts valid text", () => {
    expect(matches("http://localhost:1234", regex)).toBe(true);
    expect(matches("https://localhost:1234", regex)).toBe(true);
    expect(matches("http://localhost:1234/", regex)).toBe(true);
  });

  it("rejects invalid text", () => {
    expect(matches("", regex)).toBe(false);
    expect(matches("foo", regex)).toBe(false);
    expect(matches("http://localhost", regex)).toBe(false);
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
    expect(matches("\n\n", regex)).toBe(false);
    expect(matches("  ", regex)).toBe(false);
    expect(matches(" Xy", regex)).toBe(false);
    expect(matches("Xy ", regex)).toBe(false);
    expect(matches("X\n", regex)).toBe(false);
    expect(matches("X\tY", regex)).toBe(false);
  });
});

describe("USER_HANDLE_REGEX", () => {
  const regex = USER_HANDLE_REGEX;

  it("accepts valid user handles", () => {
    expect(matches("M", regex)).toBe(true);
    expect(matches("Mo", regex)).toBe(true);
    expect(matches("x0", regex)).toBe(true);
    expect(matches("x_0", regex)).toBe(true);
    expect(matches("x_0_a1b", regex)).toBe(true);
    expect(matches("x1_bcd", regex)).toBe(true);
  });

  it("rejects invalid user handles", () => {
    expect(matches("", regex)).toBe(false);
    expect(matches(" M", regex)).toBe(false);
    expect(matches("M ", regex)).toBe(false);
    expect(matches("M.", regex)).toBe(false);
    expect(matches("X..Y", regex)).toBe(false);
    expect(matches("X Y", regex)).toBe(false);
    expect(matches("X-Y", regex)).toBe(false);
    expect(matches("0123", regex)).toBe(false);
    expect(matches("x_0_", regex)).toBe(false);
    expect(matches("x__1", regex)).toBe(false);
    expect(matches("1a", regex)).toBe(false);
    expect(matches("a\nb", regex)).toBe(false);
    expect(matches("a\tb", regex)).toBe(false);
  });
});

describe("USER_DISPLAY_NAME_UNICODE_REGEX", () => {
  const regex = USER_DISPLAY_NAME_UNICODE_REGEX;

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
