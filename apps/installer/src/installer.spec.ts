import { execSync } from "child_process";
import { join } from "path";
import type { Kysely } from "kysely";

import { TEST_ENV } from "@fieldzoo/app-config";
import { getTestDB, closeTestDB, resetTestDB } from "@fieldzoo/testing-utils";
import { clearDatabase } from "@fieldzoo/postgres-utils";

let db: Kysely<any>;

beforeAll(() => (db = getTestDB()));

afterAll(() => closeTestDB());

describe("installer", () => {
  it("should install tables from scratch by default", async () => {
    await clearDatabase(db);
    const cliPath = join(__dirname, "../dist/installer.js");
    try {
      const stdout = execSync(
        `node --enable-source-maps ${cliPath} --env ${TEST_ENV}`
      );
      expect(stdout.toString()).toMatch(/Installed/);
    } catch (err: any) {
      if (!err.stdout) throw err;
      throw Error("Command failed with stdout: " + err.stdout.toString());
    }
  });

  it("should decline installation when one is present", async () => {
    await resetTestDB();
    const cliPath = join(__dirname, "../dist/installer.js");
    const err = await getError<any>(() =>
      execSync(`node --enable-source-maps ${cliPath} --env ${TEST_ENV}`)
    );
    expect(err?.stderr.toString()).toMatch(
      /already contains tables.*reinstall/
    );
  });
});

/**
 * Retrieve an error for examination. Modified from
 * https://stackoverflow.com/a/49512933/650894
 *
 * @param call Function that may throw an error; can be async
 * @returns The thrown error if one was thrown, otherwise returns
 *   the error NoErrorThrownError
 */
export async function getError<E>(call: () => unknown): Promise<E | null> {
  try {
    await call(); // need not be async
    return null;
  } catch (err: unknown) {
    return err as E;
  }
}
