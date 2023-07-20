import * as path from "path";

/**
 * Returns the path to the migration files.
 */
const pathParts = __dirname.split(path.sep);
const libsPath = pathParts
  .slice(0, pathParts.findIndex((p) => p === "libs") + 1)
  .join(path.sep);
export const MIGRATIONS_PATH = path.join(libsPath, "migrations/dist/cjs");
