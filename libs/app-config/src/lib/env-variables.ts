/**
 * Validates and parses environment variables, making them available
 * as typed values in configuration classes. Next.js loads environment
 * variables, but it does not seem to have a way to validate them or
 * encapulate them as typed values.
 *
 * Load this module first thing in `next.config.js`.
 */

import dotenv from "dotenv";
import * as path from "path";

import { PlatformConfig } from "./platform-config";
import { InvalidEnvironmentException } from "@fieldzoo/env-config";

const ENV_FILE = ".env.local";
const PATH_TO_ROOT = path.join(__dirname, "../../../..");

try {
  dotenv.config({ path: path.join(PATH_TO_ROOT, ENV_FILE) });
} catch (err: any) {
  exitWithError(`File '${ENV_FILE}' not found`);
}

export const platformConfig = createConfigOrExit(() => new PlatformConfig());

function createConfigOrExit<T>(createConfig: () => T): T {
  try {
    return createConfig();
  } catch (err: any) {
    if (err instanceof InvalidEnvironmentException) {
      exitWithError(err.toString() + "\n");
    }
    throw err;
  }
}

function exitWithError(message: string): never {
  console.error(message);
  process.exit(1);
}
