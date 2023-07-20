import { TSchema } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

import {
  CodeWordString,
  EmailString,
  HexString,
  HostNameString,
  LocalhostUrlString,
  MultiLineUnicodeString,
  SingleLineUnicodeString,
  UrlString,
  UserHandleString,
  UserNameUnicodeString,
  UuidString,
} from "./regex-types.js";

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

  it("LocalhostUrlString", () => {
    expect(check(LocalhostUrlString(), "http://localhost:1234")).toBe(true);
    expect(check(LocalhostUrlString(), "https://localhost:1234")).toBe(true);

    expect(check(LocalhostUrlString(), null)).toBe(false);
    expect(check(LocalhostUrlString(), undefined)).toBe(false);
    expect(check(LocalhostUrlString(), "")).toBe(false);
    expect(check(LocalhostUrlString(), " ")).toBe(false);
    expect(check(LocalhostUrlString(), "abc")).toBe(false);
    expect(check(LocalhostUrlString(), "http://localhost")).toBe(false);
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
    expect(check(UrlString(), "http://localhost:1234")).toBe(false);
  });

  it("UserHandleString", () => {
    expect(check(UserHandleString(), "abc")).toBe(true);
    expect(check(UserHandleString(), "a_b_c")).toBe(true);
    expect(check(UserHandleString(), "a123")).toBe(true);

    expect(check(UserHandleString(), null)).toBe(false);
    expect(check(UserHandleString(), undefined)).toBe(false);
    expect(check(UserHandleString(), "")).toBe(false);
    expect(check(UserHandleString(), " ")).toBe(false);
    expect(check(UserHandleString(), " a b ")).toBe(false);
    expect(check(UserHandleString(), "1a")).toBe(false);
    expect(check(UserHandleString(), "a-b")).toBe(false);
    expect(check(UserHandleString(), "a.b")).toBe(false);
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

  it("UuidString", () => {
    expect(check(UuidString(), "00000000-0000-0000-0000-000000000000")).toBe(
      true
    );
    expect(check(UuidString(), "ae19af00-af09-af09-af09-abcde129af00")).toBe(
      true
    );
    expect(check(UuidString(), "AE19AF00-AF09-AF09-AF09-ABCDE129AF00")).toBe(
      true
    );

    expect(check(UuidString(), null)).toBe(false);
    expect(check(UuidString(), undefined)).toBe(false);
    expect(check(UuidString(), "")).toBe(false);
    expect(check(UuidString(), " ")).toBe(false);
    expect(check(UuidString(), "abc")).toBe(false);
    expect(check(UuidString(), "gggggggg-gggg-gggg-gggg-gggggggggggg")).toBe(
      false
    );
    expect(check(UuidString(), "ae19AF00aF09aF09aF09aBcDe129AF00")).toBe(false);
  });
});

function check(schema: TSchema, value: any) {
  return Value.Check(schema, value);
}
