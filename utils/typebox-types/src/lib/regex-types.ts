/**
 * Regexes for use by Field Zoo.
 *
 * Regexes with flags (e.g. /u or /i) can't be tested via TypeBox's
 * `Type.RegEx()` type. Instead, they have to be stored as named formats
 * tested as follows:
 *
 * `Type.String({ format: "FORMAT_NAME" })`
 */

import { StringOptions, Type } from "@sinclair/typebox";
import { TypeSystem } from "@sinclair/typebox/system";
import { fastFormats } from "ajv-formats/dist/formats";

import {
  CODE_WORD_REGEX,
  HEX_REGEX,
  HOST_NAME_REGEX,
  MULTI_LINE_UNICODE_REGEX,
  SINGLE_LINE_UNICODE_REGEX,
  USER_HANDLE_REGEX,
  USER_NAME_UNICODE_REGEX,
} from "./regexes";

export function CodeWordString(options?: StringOptions) {
  return Type.RegEx(CODE_WORD_REGEX, options);
}

export function EmailString(options?: StringOptions) {
  return Type.RegEx(fastFormats.email, options);
}

export function HexString(options?: StringOptions) {
  return Type.RegEx(HEX_REGEX, options);
}

export function HostNameString(options?: StringOptions) {
  return Type.RegEx(HOST_NAME_REGEX, options);
}

export function MultiLineUnicodeString(options?: StringOptions) {
  return Type.String({ ...options, format: "MULTI_LINE_UNICODE" });
}
TypeSystem.Format("MULTI_LINE_UNICODE", (v) =>
  MULTI_LINE_UNICODE_REGEX.test(v)
);

export function SingleLineUnicodeString(options?: StringOptions) {
  return Type.String({ ...options, format: "SINGLE_LINE_UNICODE" });
}
TypeSystem.Format("SINGLE_LINE_UNICODE", (v) =>
  SINGLE_LINE_UNICODE_REGEX.test(v)
);

export function UrlString(options?: StringOptions) {
  return Type.String({ ...options, format: "URL" });
}
TypeSystem.Format("URL", (v) => fastFormats.url.test(v));

export function UserHandleString(options?: StringOptions) {
  return Type.String({ ...options, format: "USER_HANDLE" });
}
TypeSystem.Format("USER_HANDLE", (v) => USER_HANDLE_REGEX.test(v));

export function UserNameUnicodeString(options?: StringOptions) {
  return Type.String({ ...options, format: "USER_NAME_UNICODE" });
}
TypeSystem.Format("USER_NAME_UNICODE", (v) => USER_NAME_UNICODE_REGEX.test(v));

export function UuidString(options?: StringOptions) {
  return Type.String({ ...options, format: "UUID" });
}
TypeSystem.Format("UUID", (v) => fastFormats.uuid.test(v));
