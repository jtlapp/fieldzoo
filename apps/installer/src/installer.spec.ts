import { execSync } from "child_process";
import { join } from "path";
import type { Kysely } from "kysely";

import { TEST_ENV } from "@fieldzoo/app-config";
import { getDB, closeDB, resetTestDB } from "@fieldzoo/database";
import { dropAllTables } from "@fieldzoo/postgres-utils";
import { getError } from "@fieldzoo/testing-utils";

let db: Kysely<any>;

beforeAll(() => (db = getDB()));

afterAll(() => closeDB());

describe("installer", () => {
  it("should install tables from scratch by default", async () => {
    await dropAllTables(db);
    const cliPath = join(__dirname, "../dist/installer.js");
    try {
      const stdout = execSync(
        `node --enable-source-maps ${cliPath} --env ${TEST_ENV}`,
      );
      expect(stdout.toString()).toMatch(/Installed/);
    } catch (err: any) {
      if (!err.stdout) throw err;
      throw new Error("Command failed with stdout: " + err.stdout.toString());
    }
  });

  it("should decline installation when one is present", async () => {
    await resetTestDB(db);
    const cliPath = join(__dirname, "../dist/installer.js");
    const err = await getError<any>(() =>
      execSync(`node --enable-source-maps ${cliPath} --env ${TEST_ENV}`),
    );
    expect(err?.stderr.toString()).toMatch(
      /already contains tables.*reinstall/,
    );
  });
});
