import { SupabaseConfig } from "./supabase-config";

import { setTestEnvVariables } from "./set-test-env-variables";
import { InvalidEnvironmentException } from "./invalid-env-exception";

const ALL_VARS = [
  "SUPABASE_URL",
  "SUPABASE_DATABASE",
  "SUPABASE_USER",
  "SUPABASE_PASSWORD",
  "SUPABASE_MAX_CONNECTIONS",
];

describe("database configuration", () => {
  it("accepts valid configurations", () => {
    let config = createConfig({
      SUPABASE_URL: "localhost:123",
      SUPABASE_DATABASE: "foo",
      SUPABASE_USER: "bar",
      SUPABASE_PASSWORD: "xyz",
      SUPABASE_MAX_CONNECTIONS: "1",
    });
    expect(config).toEqual({
      connectionString: "localhost:123",
      database: "foo",
      user: "bar",
      password: "xyz",
      max: 1,
    });

    config = createConfig({
      SUPABASE_URL: "abc.def.com:2001",
      SUPABASE_DATABASE: "_foo123",
      SUPABASE_USER: "_bar123",
      SUPABASE_PASSWORD: "d kd #$ !",
      SUPABASE_MAX_CONNECTIONS: "10",
    });
    expect(config).toEqual({
      connectionString: "abc.def.com:2001",
      database: "_foo123",
      user: "_bar123",
      password: "d kd #$ !",
      max: 10,
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
        SUPABASE_URL: "",
        SUPABASE_DATABASE: "",
        SUPABASE_USER: "",
        SUPABASE_PASSWORD: "",
        SUPABASE_MAX_CONNECTIONS: "",
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
    expect.assertions(ALL_VARS.length);
    try {
      createConfig({
        SUPABASE_URL: undefined as unknown as string,
        SUPABASE_DATABASE: "bar bar",
        SUPABASE_USER: "baz baz ",
        SUPABASE_PASSWORD: "abcdef",
        SUPABASE_MAX_CONNECTIONS: "0",
      });
    } catch (e: unknown) {
      if (!(e instanceof InvalidEnvironmentException)) throw e;
      const invalids = ALL_VARS.slice(0, ALL_VARS.length - 1);
      expect(e.errors.length).toEqual(invalids.length);
      for (const error of e.errors) {
        expect(ALL_VARS).toContain(error.envVarName);
      }
    }
  });

  it("produces friendly error messages", () => {
    expect.assertions(1);
    try {
      createConfig({
        SUPABASE_URL: "",
        SUPABASE_DATABASE: "foo bar",
        SUPABASE_USER: "foo bar",
        SUPABASE_PASSWORD: "",
      });
    } catch (e: unknown) {
      if (!(e instanceof InvalidEnvironmentException)) throw e;
      expect(e.errors).toEqual([
        {
          envVarName: "SUPABASE_URL",
          errorMessage: "invalid Supabase server URL",
        },
        {
          envVarName: "SUPABASE_DATABASE",
          errorMessage: "invalid database name",
        },
        {
          envVarName: "SUPABASE_USER",
          errorMessage: "invalid user",
        },
        {
          envVarName: "SUPABASE_PASSWORD",
          errorMessage: "password should not be empty",
        },
        {
          envVarName: "SUPABASE_MAX_CONNECTIONS",
          errorMessage: "max connections must be an integer >= 1",
        },
      ]);
    }
  });
});

function createConfig(vars: Record<string, string>) {
  setTestEnvVariables(ALL_VARS, vars);
  return new SupabaseConfig();
}
