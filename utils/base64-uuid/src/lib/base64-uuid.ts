import { randomUUID } from "crypto";

import { Encoder } from "./objectid64.js";

/**
 * The length of a base64 encoded UUID.
 */
export const BASE64_UUID_LENGTH = 22;

/**
 * Regex matching a base64 encoded UUID.
 */
export const BASE64_UUID_REGEX = /^[-_A-Za-z0-9]{22}$/;

/**
 * Singleton that encodes and decodes object IDs. It caches conversion
 * data for performance, so we only want to create a single instance.
 */
const idEncoder = new Encoder();

/**
 * Creates a base64 encoded string based on a UUID.
 */
export function createBase64UUID(): string {
  return idEncoder.fromUUID(randomUUID());
}
