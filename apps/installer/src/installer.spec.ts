import { execSync } from "child_process";
import { join } from "path";
import { type Kysely } from "kysely";

import { TEST_ENV } from "@fieldzoo/config";
import { getDB, closeDB, resetTestDB } from "@fieldzoo/database";

let db: Kysely<any>;

beforeAll(() => (db = getDB()));

afterAll(() => closeDB());

describe("installer", () => {
  it("should install tables from scratch by default", async () => {
    await resetTestDB(db);
    const cliPath = join(__dirname, "../../installer/dist/installer.js");
    expect(() =>
      execSync(`node --enable-source-maps ${cliPath} --env ${TEST_ENV}`),
    ).toThrow(/Hello World/);
  });
});
