import { randomUUID } from "crypto";

import { Encoder } from "./objectid64";

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
