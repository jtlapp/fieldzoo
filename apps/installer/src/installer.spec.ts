import { execSync } from "child_process";
import { join } from "path";
import { type Kysely } from "kysely";

import { TEST_ENV } from "@fieldzoo/config";
import { getDB, closeDB, resetTestDB } from "@fieldzoo/database";
import { getError } from "@fieldzoo/utilities";

let db: Kysely<any>;

beforeAll(() => (db = getDB()));

afterAll(() => closeDB());

describe("installer", () => {
  it("should install tables from scratch by default", async () => {
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
