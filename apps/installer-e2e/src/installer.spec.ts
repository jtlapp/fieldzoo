import { execSync } from "child_process";
import { join } from "path";

import { TEST_ENV } from "@fieldzoo/config";
import { resetTestDB } from "@fieldzoo/database";

describe("installer", () => {
  it("should install tables from scratch by default", async () => {
    await resetTestDB();
    const cliPath = join(__dirname, "../../installer/dist/app/installer.js");
    try {
      execSync(`node --enable-source-maps ${cliPath} --env ${TEST_ENV}`);
      fail("expected command to fail");
    } catch (err: any) {
      console.log("**** stdout", err.stdout.toString());
      expect(err.stderr.toString()).toMatch(/Hello World/);
    }
  });
});
