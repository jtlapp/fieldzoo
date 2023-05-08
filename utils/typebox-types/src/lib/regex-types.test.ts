import { TSchema } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

import {
  CodeWordString,
  EmailString,
  HexString,
  HostNameString,
  MultiLineUnicodeString,
  SingleLineUnicodeString,
  UrlString,
  UserNameUnicodeString,
} from "./regex-types";

describe("regex type schemas", () => {
  it("CodeWordString", () => {
    expect(check(CodeWordString(), "a")).toBe(true);
    expect(check(CodeWordString(), "A")).toBe(true);
    expect(check(CodeWordString(), "_1")).toBe(true);

    expect(check(CodeWordString(), null)).toBe(false);
    expect(check(CodeWordString(), undefined)).toBe(false);
    expect(check(CodeWordString(), "")).toBe(false);
    expect(check(CodeWordString(), " ")).toBe(false);
    expect(check(CodeWordString(), "a b")).toBe(false);
    expect(check(CodeWordString(), "1")).toBe(false);
  });

  it("EmailString", () => {
    expect(check(EmailString(), "abc@def.ghi")).toBe(true);

    expect(check(EmailString(), null)).toBe(false);
    expect(check(EmailString(), undefined)).toBe(false);
    expect(check(EmailString(), "")).toBe(false);
    expect(check(EmailString(), " ")).toBe(false);
    expect(check(CodeWordString(), "a b")).toBe(false);
  });

  it("HexString", () => {
    expect(check(HexString(), "0aF9")).toBe(true);

    expect(check(HexString(), null)).toBe(false);
    expect(check(HexString(), undefined)).toBe(false);
    expect(check(HexString(), "")).toBe(false);
    expect(check(HexString(), " ")).toBe(false);
    expect(check(CodeWordString(), "a b")).toBe(false);
  });

  it("HostNameString", () => {
    expect(check(HostNameString(), "def.ghi")).toBe(true);

    expect(check(HostNameString(), null)).toBe(false);
    expect(check(HostNameString(), undefined)).toBe(false);
    expect(check(HostNameString(), "")).toBe(false);
    expect(check(HostNameString(), " ")).toBe(false);
    expect(check(CodeWordString(), "a b")).toBe(false);
  });

  it("MultiLineUnicodeString", () => {
    expect(check(MultiLineUnicodeString(), "abc")).toBe(true);
    expect(check(MultiLineUnicodeString(), "a\nb\nc")).toBe(true);
    expect(check(MultiLineUnicodeString(), "a\nb\n\nc")).toBe(true);

    expect(check(MultiLineUnicodeString(), null)).toBe(false);
    expect(check(MultiLineUnicodeString(), undefined)).toBe(false);
    expect(check(MultiLineUnicodeString(), "")).toBe(false);
    expect(check(MultiLineUnicodeString(), " ")).toBe(false);
    expect(check(MultiLineUnicodeString(), " abc ")).toBe(false);
  });

  it("SingleLineUnicodeString", () => {
    expect(check(SingleLineUnicodeString(), "abc")).toBe(true);

    expect(check(SingleLineUnicodeString(), "a\nb\nc")).toBe(false);
    expect(check(SingleLineUnicodeString(), null)).toBe(false);
    expect(check(SingleLineUnicodeString(), undefined)).toBe(false);
    expect(check(SingleLineUnicodeString(), "")).toBe(false);
    expect(check(SingleLineUnicodeString(), " ")).toBe(false);
    expect(check(SingleLineUnicodeString(), " abc ")).toBe(false);
  });

  it("UrlString", () => {
    expect(
      check(UrlString(), "https://def.ghi:3000/a/b?x=32&c=a%20b&d=q+r#frag")
    ).toBe(true);

    expect(check(UrlString(), null)).toBe(false);
    expect(check(UrlString(), undefined)).toBe(false);
    expect(check(UrlString(), "")).toBe(false);
    expect(check(UrlString(), " ")).toBe(false);
  });

  it("UserNameUnicodeString", () => {
    expect(check(UserNameUnicodeString(), "abc")).toBe(true);
    expect(check(UserNameUnicodeString(), "a-b-c")).toBe(true);
    expect(check(UserNameUnicodeString(), "a b c")).toBe(true);

    expect(check(UserNameUnicodeString(), null)).toBe(false);
    expect(check(UserNameUnicodeString(), undefined)).toBe(false);
    expect(check(UserNameUnicodeString(), "")).toBe(false);
    expect(check(UserNameUnicodeString(), " ")).toBe(false);
    expect(check(UserNameUnicodeString(), " ab ")).toBe(false);
  });
});

function check(schema: TSchema, value: any) {
  return Value.Check(schema, value);
}
