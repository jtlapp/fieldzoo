import { Encoder } from "./objectid64";

/**
 * Singleton that encodes and decodes object IDs. It caches conversion
 * data for performance, so we only want to create a single instance.
 */
export const idEncoder = new Encoder();
