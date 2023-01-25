import {
  IsInt,
  IsAlpha,
  IsPositive,
  MaxLength,
  MinLength,
} from "class-validator";

import { assertValid, ValidationError } from "./validation";

class TestObj {
  @IsInt()
  delta: number;

  @IsPositive()
  @IsInt()
  count: number;

  @IsAlpha()
  @MinLength(5)
  @MaxLength(10)
  name: string;

  constructor(delta: number, count: number, name: string) {
    this.delta = delta;
    this.count = count;
    this.name = name;
  }
}

describe("assertValid()", () => {
  it("accepts valid objects", () => {
    let obj = new TestObj(0, 1, "ABCDE");
    expect(() => assertValid(obj, "oops")).not.toThrow();

    obj = new TestObj(-5, 125, "ABCDEDEFGH");
    expect(() => assertValid(obj, "oops")).not.toThrow();
  });

  it("rejects objects with single invalid fields having single errors", () => {
    let obj = new TestObj(0.5, 1, "ABCDE");
    expectErrors(obj, "bad", true, ["bad:", "delta", "integer"], []);
    expectErrors(obj, "bad", false, ["bad"], ["delta", "integer"]);

    obj = new TestObj(0, 0, "ABCDE");
    expectErrors(obj, "oops", true, ["oops:", "count", "positive"], []);
    expectErrors(obj, "oops", false, ["oops"], ["count", "positive"]);

    obj = new TestObj(0, 1, "12345");
    expectErrors(obj, "bad", true, ["bad:", "name", "letters"], []);
    expectErrors(obj, "bad", false, ["bad"], ["name", "letters"]);
  });

  it("rejects objects with single invalid fields having multiple errors", () => {
    // validation quits after first error for each property

    let obj = new TestObj(0, 1, "123");
    expectErrors(
      obj,
      "bad",
      true,
      ["bad:", "name", "longer"],
      ["shorter", "letters"]
    );
    expectErrors(
      obj,
      "bad",
      false,
      ["bad"],
      ["name", "letters", ";", "longer", "shorter"]
    );

    obj = new TestObj(0, 1, "123456789012345");
    expectErrors(
      obj,
      "bad",
      true,
      ["bad:", "name", "shorter"],
      ["longer", "letters"]
    );
    expectErrors(
      obj,
      "bad",
      false,
      ["bad"],
      ["name", "letters", ";", "shorter", "longer"]
    );
  });

  it("rejects objects with multiple invalid fields", () => {
    let obj = new TestObj(0.5, 0, "ABCDE");
    expectErrors(
      obj,
      "bad",
      true,
      ["bad:", "delta", "integer", "count", "positive"],
      []
    );
    expectErrors(
      obj,
      "bad",
      false,
      ["bad"],
      ["delta", "integer", "count", "positive"]
    );

    obj = new TestObj(0.5, 0, "123");
    expectErrors(
      obj,
      "oops",
      true,
      ["oops:", "delta", "integer", "count", "positive", "name", "longer"],
      ["letters"]
    );
    expectErrors(
      obj,
      "oops",
      false,
      ["oops"],
      ["delta", "integer", "count", "positive", "name", "letters", "longer"]
    );
  });

  it("lazily evaluates error messages", () => {
    const ERROR_MESSAGE = "Invalid test object";
    const obj = new TestObj(0.5, 1, "ABCDE");
    try {
      assertValid(obj, () => ERROR_MESSAGE, false);
      fail("expected validation error");
    } catch (err: any) {
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.message).toEqual(ERROR_MESSAGE);
    }
  });
});

function expectErrors(
  obj: TestObj,
  message: string,
  reportFieldMessages: boolean,
  expectedSubstrings: string[],
  unexpectedSubstrings: string[]
): void {
  try {
    assertValid(obj, message, reportFieldMessages);
    fail("expected validation errors");
  } catch (err: any) {
    expect(err).toBeInstanceOf(ValidationError);
    for (const substr of expectedSubstrings) {
      expect(err.message).toContain(substr);
    }
    for (const substr of unexpectedSubstrings) {
      expect(err.message).not.toContain(substr);
    }
  }
}
