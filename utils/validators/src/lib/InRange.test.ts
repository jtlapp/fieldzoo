import { validateSync } from "class-validator";

import { InRange } from "./InRange";

describe("@InRange validation decorator", () => {
  class TestObj1 {
    @InRange(-10, 20.5)
    value: number;

    constructor(value: number) {
      this.value = value;
      const errors = validateSync(this);
      if (errors.length > 0) {
        throw Error(errors[0].constraints!.inRange);
      }
    }
  }

  class TestObj2 {
    @InRange(-10, 20.5, { message: "invalid range" })
    value: number;

    constructor(value: number) {
      this.value = value;
      const errors = validateSync(this);
      if (errors.length > 0) {
        throw Error(errors[0].constraints!.inRange);
      }
    }
  }

  it("accepts values within the range", () => {
    expect(() => new TestObj1(-10)).not.toThrow();
    expect(() => new TestObj1(0.5)).not.toThrow();
    expect(() => new TestObj1(20.5)).not.toThrow();
  });

  it("rejects values outside of the range", () => {
    const message = "value must be a number >= -10 and <= 20.5";
    expect(() => new TestObj1(undefined!)).toThrow(message);
    expect(() => new TestObj1(null!)).toThrow(message);
    expect(() => new TestObj1("" as any)).toThrow(message);
    expect(() => new TestObj1("foo" as any)).toThrow(message);
    expect(() => new TestObj1("123" as any)).toThrow(message);
    expect(() => new TestObj1(-10.05)).toThrow(message);
    expect(() => new TestObj1(20.6)).toThrow(message);
    expect(() => new TestObj1(100)).toThrow(message);
  });

  it("uses a replacement error message", () => {
    expect(() => new TestObj2(100)).toThrow("invalid range");
  });
});
