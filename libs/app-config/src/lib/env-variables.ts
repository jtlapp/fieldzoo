/**
 * Validates and parses environment variables, making them available
 * as typed values in configuration classes. Next.js loads environment
 * variables, but it does not seem to have a way to validate them or
 * encapulate them as typed values.
 *
 * To facilitate testing, this module can be used with or without
 * the `.env.local` file. It uses the values previously loaded into
 * `process.env`, but you can call `loadAndValidateEnvFile()` to load
 * the environment variables from `.env.local`.
 *
 * Call `loadAndValidateEnvFile()` first thing in `next.config.js`.
 */

import dotenv from "dotenv";
import * as path from "path";

import { PlatformConfig } from "./platform-config";
import { InvalidEnvironmentException } from "@fieldzoo/env-config";

let platformConfig: PlatformConfig | null = null;

/**
 * Returns the platform configuration, creating it from environment
 * variables if it has not already been created.
 * @returns The platform configuration.
 */
export function getPlatformConfig(): PlatformConfig {
  if (!platformConfig) {
    platformConfig = _createConfigOrExit(() => new PlatformConfig());
  }
  return platformConfig;
}

/**
 * Loads and validates the environment variables from `.env.local`.
 * Exits the application with an error message if any environment
 * variables are invalid.
 */
export function loadAndValidateEnvFile(): void {
  const ENV_FILE = ".env.local";
  const PATH_TO_ROOT = path.join(__dirname, "../../../..");
  try {
    dotenv.config({ path: path.join(PATH_TO_ROOT, ENV_FILE) });
  } catch (err: any) {
    _exitWithError(`File '${ENV_FILE}' not found`);
  }
  getPlatformConfig();
}

function _createConfigOrExit<T>(createConfig: () => T): T {
  try {
    return createConfig();
  } catch (err: any) {
    if (err instanceof InvalidEnvironmentException) {
      _exitWithError(err.toString() + "\n");
    }
    throw err;
  }
}

function _exitWithError(message: string): never {
  console.error(message);
  process.exit(1);
}
