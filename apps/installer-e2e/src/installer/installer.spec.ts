import { execSync } from "child_process";
import { join } from "path";

import { TEST_ENV } from "@fieldzoo/config";
import { resetTestDB } from "@fieldzoo/database";

describe("installer", () => {
  it("should install tables from scratch by default", async () => {
    await resetTestDB();
    const cliPath = join(process.cwd(), "dist/apps/installer");
    const output = execSync(`node ${cliPath} --env ${TEST_ENV}`).toString();
    expect(output).toMatch(/Hello World/);
  });
});
