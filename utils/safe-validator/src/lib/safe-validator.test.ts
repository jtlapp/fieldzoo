import { Type } from "@sinclair/typebox";

import { SafeValidator } from "./safe-validator";
import { InvalidShapeError } from "./invalid-shape";

class TestObj1 {
  delta: number;
  count: number;
  name: string;

  static readonly validator = new SafeValidator(
    Type.Object({
      delta: Type.Integer(),
      count: Type.Integer({ exclusiveMinimum: 0 }),
      name: Type.RegEx(/[a-zA-Z]+/, {
        minLength: 5,
        maxLength: 10,
        message: "name should consist of 5-10 letters",
      }),
    })
  );

  constructor(delta: number, count: number, name: string) {
    this.delta = delta;
    this.count = count;
    this.name = name;
  }

  safeValidate() {
    TestObj1.validator.safeValidate(this, "Bad TestObj1");
  }

  unsafeValidate() {
    TestObj1.validator.unsafeValidate(this, "Bad TestObj1");
  }
}

class TestObj2 {
  int1: number;
  int2: number;
  alpha: string;

  static readonly validator = new SafeValidator(
    Type.Object({
      int1: Type.Integer({ message: "{field} must be an integer" }),
      int2: Type.Integer({ message: "{field} must be an integer" }),
      alpha: Type.RegEx(/[a-zA-Z]+/, { maxLength: 4 }),
    })
  );

  constructor(int1: number, int2: number, alpha: string) {
    this.int1 = int1;
    this.int2 = int2;
    this.alpha = alpha;
  }

  safeValidate() {
    TestObj2.validator.safeValidate(this, "Bad TestObj2");
  }

  unsafeValidate() {
    TestObj2.validator.unsafeValidate(this, "Bad TestObj2");
  }
}

describe("safeValidate()", () => {
  it("accepts valid objects", () => {
    expect(() => new TestObj1(0, 1, "ABCDE")).not.toThrow();
    expect(() => new TestObj1(-5, 125, "ABCDEDEFGH")).not.toThrow();
  });

  it("rejects objects with single invalid fields reporting a single error", () => {
    expect.assertions(3);
    try {
      new TestObj1(0.5, 1, "ABCDE").safeValidate();
    } catch (err: unknown) {
      if (!(err instanceof InvalidShapeError)) throw err;
      expect(err.details.length).toEqual(1);
      const message = "delta: Expected integer";
      expect(err.details[0].toString()).toEqual(message);
      expect(err.toString()).toEqual("Bad TestObj1: " + message);
    }
  });

  it("rejects objects with multiple invalid fields reporting a single error", () => {
    expect.assertions(3);
    try {
      new TestObj1(0.5, 0, "ABCDE").safeValidate();
    } catch (err: unknown) {
      if (!(err instanceof InvalidShapeError)) throw err;
      expect(err.details.length).toEqual(1);
      const message = "delta: Expected integer";
      expect(err.details[0].toString()).toEqual(message);
      expect(err.toString()).toEqual("Bad TestObj1: " + message);
    }
  });

  it("rejects objects with multiply invalid field reporting a single error", () => {
    expect.assertions(3);
    try {
      new TestObj2(1, 1, "ABCDE").safeValidate();
    } catch (err: unknown) {
      if (!(err instanceof InvalidShapeError)) throw err;
      expect(err.details.length).toEqual(1);
      const message = "alpha: Expected string length less or equal to 4";
      expect(err.details[0].toString()).toEqual(message);
      expect(err.toString()).toEqual("Bad TestObj2: " + message);
    }
  });

  it("rejects objects reporting a custom error message", () => {
    expect.assertions(3);
    try {
      new TestObj1(1, 1, "12345").safeValidate();
    } catch (err: unknown) {
      if (!(err instanceof InvalidShapeError)) throw err;
      expect(err.details.length).toEqual(1);
      const message = "name should consist of 5-10 letters";
      expect(err.details[0].toString()).toEqual(message);
      expect(err.toString()).toEqual("Bad TestObj1: " + message);
    }
  });
});

describe("unsafeValidate()", () => {
  it("rejects objects with single invalid field reporting a single error", () => {
    expect.assertions(3);
    try {
      new TestObj1(0.5, 1, "ABCDE").unsafeValidate();
    } catch (err: unknown) {
      if (!(err instanceof InvalidShapeError)) throw err;
      expect(err.details.length).toEqual(1);
      const message = "delta: Expected integer";
      expect(err.details[0].toString()).toEqual(message);
      expect(err.toString()).toEqual("Bad TestObj1: " + message);
    }
  });

  it("rejects objects with multiple invalid fields reporting all errors", () => {
    expect.assertions(5);
    try {
      new TestObj1(0.5, 0, "ABCDEGHIJKLMN").unsafeValidate();
    } catch (err: unknown) {
      if (!(err instanceof InvalidShapeError)) throw err;
      expect(err.details.length).toEqual(3);
      const message1 = "delta: Expected integer";
      const message2 = "count: Expected integer to be greater than 0";
      const message3 = "name should consist of 5-10 letters";
      expect(err.details[0].toString()).toEqual(message1);
      expect(err.details[1].toString()).toEqual(message2);
      expect(err.details[2].toString()).toEqual(message3);
      expect(err.toString()).toEqual(
        `Bad TestObj1:\n- ${message1}\n- ${message2}\n- ${message3}`
      );
    }
  });

  it("rejects objects with multiply invalid field reporting all errors", () => {
    expect.assertions(4);
    try {
      new TestObj2(1, 1, "12345").unsafeValidate();
    } catch (err: unknown) {
      if (!(err instanceof InvalidShapeError)) throw err;
      expect(err.details.length).toEqual(2);
      const message1 = "alpha: Expected string length less or equal to 4";
      const message2 = "alpha: Expected string to match pattern [a-zA-Z]+";
      expect(err.details[0].toString()).toEqual(message1);
      expect(err.details[1].toString()).toEqual(message2);
      expect(err.toString()).toEqual(
        `Bad TestObj2:\n- ${message1}\n- ${message2}`
      );
    }
  });

  it("rejects objects reporting custom error messages with fields", () => {
    expect.assertions(4);
    try {
      new TestObj2(0.5, 0.5, "ABCD").unsafeValidate();
    } catch (err: unknown) {
      if (!(err instanceof InvalidShapeError)) throw err;
      expect(err.details.length).toEqual(2);
      const message1 = "int1 must be an integer";
      const message2 = "int2 must be an integer";
      expect(err.details[0].toString()).toEqual(message1);
      expect(err.details[1].toString()).toEqual(message2);
      expect(err.toString()).toEqual(
        `Bad TestObj2:\n- ${message1}\n- ${message2}`
      );
    }
  });
});
