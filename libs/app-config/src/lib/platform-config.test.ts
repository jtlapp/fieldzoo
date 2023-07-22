import {
  InvalidEnvironmentException,
  setTestEnvVariables,
} from "@fieldzoo/env-config";

import { PlatformConfig } from "./platform-config";

const ALL_VARS = ["PUBLIC_SUPABASE_URL", "PUBLIC_SUPABASE_ANON_KEY"];

describe("platform configuration", () => {
  it("accepts valid configurations", () => {
    createConfig({
      PUBLIC_SUPABASE_URL: "https://abc.def",
      PUBLIC_SUPABASE_ANON_KEY: "123",
    });
    createConfig({
      PUBLIC_SUPABASE_URL: "http://localhost:54321",
      PUBLIC_SUPABASE_ANON_KEY: "123",
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
        PUBLIC_SUPABASE_URL: "",
        PUBLIC_SUPABASE_ANON_KEY: "",
      });
    } catch (e: unknown) {
      if (!(e instanceof InvalidEnvironmentException)) throw e;
      expect(e.errors.length).toEqual(ALL_VARS.length);
      for (const error of e.errors) {
        expect(ALL_VARS).toContain(error.envVarName);
      }
    }
  });

  it("rejects invalid values, providing friendly error messages", () => {
    try {
      createConfig({
        PUBLIC_SUPABASE_URL: "-",
        PUBLIC_SUPABASE_ANON_KEY: "",
      });
    } catch (e: unknown) {
      if (!(e instanceof InvalidEnvironmentException)) throw e;
      expect(e.errors).toEqual([
        {
          envVarName: "PUBLIC_SUPABASE_URL",
          errorMessage: "Must be a URL, possibly localhost",
        },
        {
          envVarName: "PUBLIC_SUPABASE_ANON_KEY",
          errorMessage: "Must be a non-empty string",
        },
      ]);
    }
  });
});

function createConfig(vars: Record<string, string>) {
  setTestEnvVariables(ALL_VARS, vars);
  return new PlatformConfig();
}
