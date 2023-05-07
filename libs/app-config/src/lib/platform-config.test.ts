import {
  InvalidEnvironmentException,
  setTestEnvVariables,
} from "@fieldzoo/env-config";

import { PlatformConfig } from "./platform-config";

const ALL_VARS = ["MIN_PASSWORD_STRENGTH"];

describe("platform configuration", () => {
  it("accepts valid configurations", () => {
    let config = createConfig({
      MIN_PASSWORD_STRENGTH: "0",
    });
    expect(config).toEqual({
      minPasswordStrength: 0,
    });

    config = createConfig({
      MIN_PASSWORD_STRENGTH: "1",
    });
    expect(config).toEqual({
      minPasswordStrength: 1,
    });
  });

  it("rejects undefined values", () => {
    expect.assertions(ALL_VARS.length + 1);
    try {
      createConfig({});
    } catch (e: unknown) {
      if (!(e instanceof InvalidEnvironmentException)) throw e;
      expect(e.errors.length).toEqual(ALL_VARS.length);
      for (const error of e.errors) {
        expect(ALL_VARS).toContain(error.envVarName);
      }
    }
  });

  it("rejects empty strings", () => {
    expect.assertions(ALL_VARS.length + 1);
    try {
      createConfig({
        MIN_PASSWORD_STRENGTH: "",
      });
    } catch (e: unknown) {
      if (!(e instanceof InvalidEnvironmentException)) throw e;
      expect(e.errors.length).toEqual(ALL_VARS.length);
      for (const error of e.errors) {
        expect(ALL_VARS).toContain(error.envVarName);
      }
    }
  });

  it("rejects invalid values", () => {
    expect.assertions(ALL_VARS.length + 1);
    try {
      createConfig({
        MIN_PASSWORD_STRENGTH: "-1",
      });
    } catch (e: unknown) {
      if (!(e instanceof InvalidEnvironmentException)) throw e;
      expect(e.errors.length).toEqual(ALL_VARS.length);
      for (const error of e.errors) {
        expect(ALL_VARS).toContain(error.envVarName);
      }
    }
  });

  it("produces friendly error messages", () => {
    expect.assertions(1);
    try {
      createConfig({
        MIN_PASSWORD_STRENGTH: "ABC",
      });
    } catch (e: unknown) {
      if (!(e instanceof InvalidEnvironmentException)) throw e;
      expect(e.errors).toEqual([
        {
          envVarName: "MIN_PASSWORD_STRENGTH",
          errorMessage: "must be an integer >= 0",
        },
      ]);
    }
  });
});

function createConfig(vars: Record<string, string>) {
  setTestEnvVariables(ALL_VARS, vars);
  return new PlatformConfig();
}
