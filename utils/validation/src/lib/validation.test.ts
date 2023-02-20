import { Type } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";

import { freezeField, validate, ValidationError } from "./validation";
import { expectInvalid } from "../test-utils/validation-expect";

describe("validate()", () => {
  class TestObj1 {
    delta: number;
    count: number;
    name: string;

    static readonly checker = TypeCompiler.Compile(
      Type.Object({
        delta: Type.Integer(),
        count: Type.Integer({ exclusiveMinimum: 0 }),
        name: Type.RegEx(/[a-zA-Z]/, {
          minLength: 5,
          maxLength: 10,
          message: "name should consist of 5-10 letters",
        }),
      }),
    );

    constructor(delta: number, count: number, name: string) {
      this.delta = delta;
      this.count = count;
      this.name = name;
    }
  }

  class TestObj3 {
    int1: number;
    int2: number;
    alpha: string;

    static readonly checker = TypeCompiler.Compile(
      Type.Object({
        int1: Type.Integer({ message: "<> must be an integer" }),
        int2: Type.Integer({ message: "<> must be an integer" }),
        alpha: Type.RegEx(/a-zA-Z/, { maxLength: 4 }),
      }),
    );

    constructor(int1: number, int2: number, alpha: string) {
      this.int1 = int1;
      this.int2 = int2;
      this.alpha = alpha;
    }
  }

  it("accepts valid objects", () => {
    let obj = new TestObj1(0, 1, "ABCDE");
    expect(() => validate(TestObj1.checker, obj, "oops")).not.toThrow();

    obj = new TestObj1(-5, 125, "ABCDEDEFGH");
    expect(() => validate(TestObj1.checker, obj, "oops")).not.toThrow();
  });

  it("rejects objects with single invalid fields having single errors", () => {
    let obj = new TestObj1(0.5, 1, "ABCDE");
    expectInvalid(
      expect,
      TestObj1.checker,
      [obj, "bad"],
      ["bad:", "delta", "integer"],
      [],
      true,
    );
    expectInvalid(
      expect,
      TestObj1.checker,
      [obj, "bad"],
      ["bad"],
      ["delta", "integer"],
      false,
    );

    obj = new TestObj1(0, 0, "ABCDE");
    expectInvalid(
      expect,
      TestObj1.checker,
      [obj, "oops"],
      ["oops:", "count", "greater than 0"],
      [],
      true,
    );
    expectInvalid(
      expect,
      TestObj1.checker,
      [obj, "oops"],
      ["oops"],
      ["count", "greater than 0"],
      false,
    );

    obj = new TestObj1(0, 1, "12345");
    expectInvalid(
      expect,
      TestObj1.checker,
      [obj, "bad"],
      ["bad:", "name", "letters"],
      [],
      true,
    );
    expectInvalid(
      expect,
      TestObj1.checker,
      [obj, "bad"],
      ["bad"],
      ["name", "letters"],
      false,
    );
  });

  it("rejects objects with single invalid fields having multiple errors", () => {
    let obj = new TestObj1(0, 1, "123");
    expectInvalid(
      expect,
      TestObj1.checker,
      [obj, "bad"],
      ["bad:", "name", "5-10 letters"],
      [],
      true,
    );
    expectInvalid(
      expect,
      TestObj1.checker,
      [obj, "bad"],
      ["bad"],
      ["name", "letters", ";", "5-10 letters"],
      false,
    );

    obj = new TestObj1(0, 1, "123456789012345");
    expectInvalid(
      expect,
      TestObj1.checker,
      [obj, "bad"],
      ["bad:", "name", "5-10 letters"],
      [],
      true,
    );
    expectInvalid(
      expect,
      TestObj1.checker,
      [obj, "bad"],
      ["bad"],
      ["name", "letters", ";", "5-10 letters", "longer"],
      false,
    );
  });

  it("rejects objects with multiple invalid fields", () => {
    let obj = new TestObj1(0.5, 0, "ABCDE");
    expectInvalid(
      expect,
      TestObj1.checker,
      [obj, "bad"],
      ["bad:", "delta", "integer", "count", "greater than 0"],
      [],
      true,
    );
    expectInvalid(
      expect,
      TestObj1.checker,
      [obj, "bad"],
      ["bad"],
      ["delta", "integer", "count", "greater than 0"],
      false,
    );

    obj = new TestObj1(0.5, 0, "123");
    expectInvalid(
      expect,
      TestObj1.checker,
      [obj, "oops"],
      [
        "oops:",
        "delta",
        "integer",
        "count",
        "greater than 0",
        "name",
        "5-10 letters",
      ],
      [],
      true,
    );
    expectInvalid(
      expect,
      TestObj1.checker,
      [obj, "oops"],
      ["oops"],
      [
        "delta",
        "integer",
        "count",
        "greater than 0",
        "name",
        "letters",
        "5-10 letters",
      ],
      false,
    );
  });

  it("lazily evaluates error messages", () => {
    const ERROR_MESSAGE = "Invalid test object";
    const obj = new TestObj1(0.5, 1, "ABCDE");
    expect.assertions(2);
    try {
      validate(TestObj1.checker, obj, () => ERROR_MESSAGE);
    } catch (err: any) {
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.message).toEqual(ERROR_MESSAGE);
    }
  });

  it("substitutes the field name in custom error messages", () => {
    const obj = new TestObj3("abc" as any, "def" as any, "abc");
    expectInvalid(
      expect,
      TestObj3.checker,
      [obj, "oops"],
      ["oops", "int1 must be an integer", "int2 must be an integer"],
      ["a-z"],
      true,
    );

    expectInvalid(
      expect,
      TestObj3.checker,
      [obj, "oops"],
      ["oops"],
      ["int1 must be an integer", "int2 must be an integer", "a-z"],
      false,
    );
  });
});

describe("validating object", () => {
  class TestObj2 {
    id: string;
    count: number;

    static readonly checker = TypeCompiler.Compile(
      Type.Object({
        count: Type.Integer({ exclusiveMinimum: 0 }),
      }),
    );

    constructor(id: string, count: number) {
      this.id = id;
      this.count = count;
      validate(TestObj2.checker, this, "Invalid test obj 2");
      freezeField(this, "id");
    }
  }

  it("accepts valid objects", () => {
    expect(() => new TestObj2("abc", 1)).not.toThrow();
  });

  it("rejects invalid objects", () => {
    expectInvalid(
      expect,
      TestObj2.checker,
      () => new TestObj2("abc", 0),
      ["Invalid test obj 2", "greater than 0"],
      [],
      true,
    );
    expectInvalid(
      expect,
      TestObj2.checker,
      () => new TestObj2("abc", 0),
      ["Invalid test obj 2"],
      ["greater than 0"],
      false,
    );
  });

  it("cannot change frozen field", () => {
    const testObj = new TestObj2("abc", 1);
    expect(() => ((testObj as any).id = "xyz")).toThrow("read only");
  });
});
