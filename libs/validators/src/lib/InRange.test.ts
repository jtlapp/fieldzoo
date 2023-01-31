import { validateSync } from "class-validator";

import { InRange } from "./InRange";

describe("@InRange validation decorator", () => {
  class TestObj {
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

  it("accepts values within the range", () => {
    expect(() => new TestObj(-10)).not.toThrow();
    expect(() => new TestObj(0.5)).not.toThrow();
    expect(() => new TestObj(20.5)).not.toThrow();
  });

  it("rejects values outside of the range", () => {
    const message = "value must be a number >= -10 and <= 20.5";
    expect(() => new TestObj(undefined!)).toThrow(message);
    expect(() => new TestObj(null!)).toThrow(message);
    expect(() => new TestObj("" as any)).toThrow(message);
    expect(() => new TestObj("foo" as any)).toThrow(message);
    expect(() => new TestObj("123" as any)).toThrow(message);
    expect(() => new TestObj(-10.05)).toThrow(message);
    expect(() => new TestObj(20.6)).toThrow(message);
    expect(() => new TestObj(100)).toThrow(message);
  });
});
