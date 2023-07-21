import { FormatRegistry } from "@sinclair/typebox";

import { BASE64_UUID_LENGTH, BASE64_UUID_REGEX } from "@fieldzoo/base64-uuid";
import { NonEmptyString } from "@fieldzoo/typebox-types";

FormatRegistry.Set("BASE64_UUID", (v) => BASE64_UUID_REGEX.test(v));

export const Base64UuidSchema = NonEmptyString({
  format: "BASE64_UUID",
  // maxLength is redundant with regex but needed for DDOS defense
  maxLength: BASE64_UUID_LENGTH, // checked before checking regex
});
