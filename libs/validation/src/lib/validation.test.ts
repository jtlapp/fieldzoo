import {
  IsInt,
  IsAlpha,
  IsPositive,
  MaxLength,
  MinLength,
} from "class-validator";

import { assertValid, ValidatingObject, ValidationError } from "./validation";
import { expectInvalid } from "../test-utils/validation-expect";

describe("assertValid()", () => {
  class TestObj1 {
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

  it("accepts valid objects", () => {
    let obj = new TestObj1(0, 1, "ABCDE");
    expect(() => assertValid(obj, "oops")).not.toThrow();

    obj = new TestObj1(-5, 125, "ABCDEDEFGH");
    expect(() => assertValid(obj, "oops")).not.toThrow();
  });

  it("rejects objects with single invalid fields having single errors", () => {
    let obj = new TestObj1(0.5, 1, "ABCDE");
    expectInvalid([obj, "bad", true], ["bad:", "delta", "integer"], []);
    expectInvalid([obj, "bad", false], ["bad"], ["delta", "integer"]);

    obj = new TestObj1(0, 0, "ABCDE");
    expectInvalid([obj, "oops", true], ["oops:", "count", "positive"], []);
    expectInvalid([obj, "oops", false], ["oops"], ["count", "positive"]);

    obj = new TestObj1(0, 1, "12345");
    expectInvalid([obj, "bad", true], ["bad:", "name", "letters"], []);
    expectInvalid([obj, "bad", false], ["bad"], ["name", "letters"]);
  });

  it("rejects objects with single invalid fields having multiple errors", () => {
    // validation quits after first error for each property

    let obj = new TestObj1(0, 1, "123");
    expectInvalid(
      [obj, "bad", true],
      ["bad:", "name", "longer"],
      ["shorter", "letters"]
    );
    expectInvalid(
      [obj, "bad", false],
      ["bad"],
      ["name", "letters", ";", "longer", "shorter"]
    );

    obj = new TestObj1(0, 1, "123456789012345");
    expectInvalid(
      [obj, "bad", true],
      ["bad:", "name", "shorter"],
      ["longer", "letters"]
    );
    expectInvalid(
      [obj, "bad", false],
      ["bad"],
      ["name", "letters", ";", "shorter", "longer"]
    );
  });

  it("rejects objects with multiple invalid fields", () => {
    let obj = new TestObj1(0.5, 0, "ABCDE");
    expectInvalid(
      [obj, "bad", true],
      ["bad:", "delta", "integer", "count", "positive"],
      []
    );
    expectInvalid(
      [obj, "bad", false],
      ["bad"],
      ["delta", "integer", "count", "positive"]
    );

    obj = new TestObj1(0.5, 0, "123");
    expectInvalid(
      [obj, "oops", true],
      ["oops:", "delta", "integer", "count", "positive", "name", "longer"],
      ["letters"]
    );
    expectInvalid(
      [obj, "oops", false],
      ["oops"],
      ["delta", "integer", "count", "positive", "name", "letters", "longer"]
    );
  });

  it("lazily evaluates error messages", () => {
    const ERROR_MESSAGE = "Invalid test object";
    const obj = new TestObj1(0.5, 1, "ABCDE");
    try {
      assertValid(obj, () => ERROR_MESSAGE, false);
      fail("expected validation error");
    } catch (err: any) {
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.message).toEqual(ERROR_MESSAGE);
    }
  });
});

describe("ValidatingObject", () => {
  class TestObj2 extends ValidatingObject {
    id: string;

    @IsPositive()
    count: number;

    constructor(id: string, count: number, reportFieldMessages: boolean) {
      super();
      this.id = id;
      this.count = count;
      this.validate("test obj 2", reportFieldMessages);
      this.freezeField("id");
    }
  }

  class TestObj3 extends TestObj2 {
    protected toErrorMessage(kindOfObject: string): string {
      return "Bad " + kindOfObject;
    }
  }

  it("accepts valid objects", () => {
    expect(() => new TestObj2("abc", 1, true)).not.toThrow();
  });

  it("rejects invalid objects", () => {
    expectInvalid(
      () => new TestObj2("abc", 0, true),
      ["Invalid test obj 2", "positive"],
      []
    );
    expectInvalid(
      () => new TestObj2("abc", 0, false),
      ["Invalid test obj 2"],
      ["positive"]
    );
    expectInvalid(
      () => new TestObj3("abc", 0, true),
      ["Bad test obj 2", "positive"],
      []
    );
  });

  it("cannot change frozen field", () => {
    const testObj = new TestObj2("abc", 1, true);
    expect(() => ((testObj as any).id = "xyz")).toThrow("read only");
  });
});
