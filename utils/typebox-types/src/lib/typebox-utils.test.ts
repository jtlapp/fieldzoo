import { TSchema, Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

import {
  EmptyStringable,
  IntegerString,
  NonEmptyString,
  Nullable,
  Zeroable,
} from "./typebox-utils";

describe("typebox utility schemas", () => {
  it("IntegerString", () => {
    expect(check(IntegerString(), "0")).toBe(true);
    expect(check(IntegerString(), "1")).toBe(true);
    expect(check(IntegerString(), "123")).toBe(true);
    expect(check(IntegerString(), "000")).toBe(true);
    expect(check(IntegerString({ minimum: 0, maximum: 0 }), "0")).toBe(true);
    expect(check(IntegerString({ minimum: 0, maximum: 100 }), "50")).toBe(true);
    expect(check(IntegerString({ maxDigits: 3 }), "100")).toBe(true);

    expect(check(IntegerString(), null)).toBe(false);
    expect(check(IntegerString(), undefined)).toBe(false);
    expect(check(IntegerString(), 1)).toBe(false);
    expect(check(IntegerString(), 1.1)).toBe(false);
    expect(check(IntegerString(), "")).toBe(false);
    expect(check(IntegerString(), "a")).toBe(false);
    expect(check(IntegerString(), "1.0")).toBe(false);
    expect(check(IntegerString(), false)).toBe(false);
    expect(check(IntegerString(), {})).toBe(false);

    expect(check(IntegerString({ minimum: 0 }), "-1")).toBe(false);
    expect(check(IntegerString({ maximum: 0 }), "1")).toBe(false);
    expect(check(IntegerString({ maxDigits: 3 }), "1000")).toBe(false);
  });

  it("EmptyStringable", () => {
    expect(check(EmptyStringable(Type.String()), "")).toBe(true);
    expect(check(EmptyStringable(Type.String()), "1")).toBe(true);

    expect(check(EmptyStringable(Type.String()), null)).toBe(false);
    expect(check(EmptyStringable(Type.String()), undefined)).toBe(false);
    expect(check(EmptyStringable(Type.String()), 0)).toBe(false);
    expect(check(EmptyStringable(Type.String()), false)).toBe(false);
  });

  it("NonEmptyString", () => {
    expect(check(NonEmptyString(Type.String()), "1")).toBe(true);

    expect(check(NonEmptyString(Type.String()), "")).toBe(false);
    expect(check(NonEmptyString(Type.String()), null)).toBe(false);
    expect(check(NonEmptyString(Type.String()), undefined)).toBe(false);
    expect(check(NonEmptyString(Type.String()), 0)).toBe(false);
    expect(check(NonEmptyString(Type.String()), false)).toBe(false);
  });

  it("Nullable", () => {
    expect(check(Nullable(Type.String()), null)).toBe(true);
    expect(check(Nullable(Type.String()), "a")).toBe(true);

    expect(check(Nullable(Type.String()), undefined)).toBe(false);
    expect(check(Nullable(Type.String()), 0)).toBe(false);
    expect(check(Nullable(Type.String()), false)).toBe(false);
  });

  it("Zeroable", () => {
    expect(check(Zeroable(Type.Integer()), 0)).toBe(true);
    expect(check(Zeroable(Type.Integer()), 1)).toBe(true);

    expect(check(Zeroable(Type.Integer()), null)).toBe(false);
    expect(check(Zeroable(Type.Integer()), undefined)).toBe(false);
    expect(check(Zeroable(Type.Integer()), false)).toBe(false);
  });
});

function check(schema: TSchema, value: any) {
  return Value.Check(schema, value);
}
