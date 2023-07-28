/**
 * Regexes for use by Field Zoo.
 *
 * Regexes with flags (e.g. /u or /i) can't be tested via TypeBox's
 * `Type.RegEx()` type. Instead, they have to be stored as named formats
 * tested as follows:
 *
 * `Type.String({ format: "FORMAT_NAME" })`
 */

// Uses FormatRegistry.Set instead of TypeSystem.Format so TypeBox doesn't
// report duplicate assignments during vitest's multiple module loads.

import { FormatRegistry, StringOptions, Type } from "@sinclair/typebox";
import { fastFormats } from "ajv-formats/dist/formats.js";

import {
  CODE_WORD_REGEX,
  HEX_REGEX,
  HOST_NAME_REGEX,
  LOCALHOST_URL_REGEX,
  MULTI_LINE_UNICODE_REGEX,
  SINGLE_LINE_UNICODE_REGEX,
  USER_HANDLE_REGEX,
  USER_DISPLAY_NAME_UNICODE_REGEX,
} from "./regexes.js";

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

export function LocalhostUrlString(options?: StringOptions) {
  return Type.RegEx(LOCALHOST_URL_REGEX, options);
}

export function MultiLineUnicodeString(options?: StringOptions) {
  return Type.String({ ...options, format: "MULTI_LINE_UNICODE" });
}
FormatRegistry.Set("MULTI_LINE_UNICODE", (v) =>
  MULTI_LINE_UNICODE_REGEX.test(v)
);

export function SingleLineUnicodeString(options?: StringOptions) {
  return Type.String({ ...options, format: "SINGLE_LINE_UNICODE" });
}
FormatRegistry.Set("SINGLE_LINE_UNICODE", (v) =>
  SINGLE_LINE_UNICODE_REGEX.test(v)
);

export function UrlString(options?: StringOptions) {
  return Type.String({ ...options, format: "URL" });
}
FormatRegistry.Set("URL", (v) => fastFormats.url.test(v));

export function UserHandleString(options?: StringOptions) {
  return Type.String({ ...options, format: "USER_HANDLE" });
}
FormatRegistry.Set("USER_HANDLE", (v) => USER_HANDLE_REGEX.test(v));

export function UserDisplayNameUnicodeString(options?: StringOptions) {
  return Type.String({ ...options, format: "USER_DISPLAY_NAME_UNICODE" });
}
FormatRegistry.Set("USER_DISPLAY_NAME_UNICODE", (v) =>
  USER_DISPLAY_NAME_UNICODE_REGEX.test(v)
);

export function UuidString(options?: StringOptions) {
  // Include maxLength to test length before testing regex.
  return Type.String({ ...options, format: "UUID", maxLength: 36 });
}
FormatRegistry.Set("UUID", (v) => fastFormats.uuid.test(v));
