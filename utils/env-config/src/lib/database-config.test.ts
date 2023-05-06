import { DatabaseConfig } from "./database-config";

import { InvalidEnvironmentError } from "./invalid-env-error";

const ALL_VARS = [
  "POSTGRES_HOST",
  "POSTGRES_PORT",
  "POSTGRES_DATABASE",
  "POSTGRES_USER",
  "POSTGRES_PASSWORD",
];

describe("database configuration", () => {
  it("accepts valid configurations", () => {
    let config = createDatabaseConfig({
      POSTGRES_HOST: "localhost",
      POSTGRES_PORT: "123",
      POSTGRES_DATABASE: "foo",
      POSTGRES_USER: "bar",
      POSTGRES_PASSWORD: "xyz",
    });
    expect(config).toEqual({
      host: "localhost",
      port: 123,
      database: "foo",
      user: "bar",
      password: "xyz",
    });

    config = createDatabaseConfig({
      POSTGRES_HOST: "abc.def.com",
      POSTGRES_PORT: "2001",
      POSTGRES_DATABASE: "_foo123",
      POSTGRES_USER: "_bar123",
      POSTGRES_PASSWORD: "d kd #$ !",
    });
    expect(config).toEqual({
      host: "abc.def.com",
      port: 2001,
      database: "_foo123",
      user: "_bar123",
      password: "d kd #$ !",
    });
  });

  it("rejects undefined values", () => {
    expect.assertions(ALL_VARS.length + 1);
    try {
      createDatabaseConfig({
        POSTGRES_HOST: undefined!,
        POSTGRES_PORT: undefined!,
        POSTGRES_DATABASE: undefined!,
        POSTGRES_USER: undefined!,
        POSTGRES_PASSWORD: undefined!,
      });
    } catch (e: unknown) {
      if (!(e instanceof InvalidEnvironmentError)) throw e;
      expect(e.errors.length).toEqual(ALL_VARS.length);
      for (const error of e.errors) {
        expect(ALL_VARS).toContain(error.envVarName);
      }
    }
  });

  it("rejects empty strings", () => {
    expect.assertions(ALL_VARS.length + 1);
    try {
      createDatabaseConfig({
        POSTGRES_HOST: "",
        POSTGRES_PORT: "65536",
        POSTGRES_DATABASE: "",
        POSTGRES_USER: "",
        POSTGRES_PASSWORD: "",
      });
    } catch (e: unknown) {
      if (!(e instanceof InvalidEnvironmentError)) throw e;
      expect(e.errors.length).toEqual(ALL_VARS.length);
      for (const error of e.errors) {
        expect(ALL_VARS).toContain(error.envVarName);
      }
    }
  });

  it("rejects invalid values", () => {
    expect.assertions(ALL_VARS.length);
    try {
      createDatabaseConfig({
        POSTGRES_HOST: "foo foo",
        POSTGRES_PORT: "-1",
        POSTGRES_DATABASE: "bar bar",
        POSTGRES_USER: "baz baz ",
        POSTGRES_PASSWORD: "abcdef",
      });
    } catch (e: unknown) {
      if (!(e instanceof InvalidEnvironmentError)) throw e;
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
      createDatabaseConfig({
        POSTGRES_HOST: "localPOSTGRES_HOST:32",
        POSTGRES_PORT: "125.5",
        POSTGRES_DATABASE: "foo bar",
        POSTGRES_USER: "foo bar",
        POSTGRES_PASSWORD: "",
      });
    } catch (e: unknown) {
      if (!(e instanceof InvalidEnvironmentError)) throw e;
      expect(e.errors).toEqual([
        {
          envVarName: "POSTGRES_HOST",
          errorMessage: "invalid host name",
        },
        {
          envVarName: "POSTGRES_PORT",
          errorMessage: "port must be an integer >= 0 and <= 65535",
        },
        {
          envVarName: "POSTGRES_DATABASE",
          errorMessage: "invalid database name",
        },
        {
          envVarName: "POSTGRES_USER",
          errorMessage: "invalid user",
        },
        {
          envVarName: "POSTGRES_PASSWORD",
          errorMessage: "password should not be empty",
        },
      ]);
    }
  });
});

function createDatabaseConfig(vars: {
  POSTGRES_HOST?: string;
  POSTGRES_PORT?: string;
  POSTGRES_DATABASE?: string;
  POSTGRES_USER?: string;
  POSTGRES_PASSWORD?: string;
}) {
  for (const varName of ALL_VARS) {
    const value = vars[varName as keyof typeof vars];
    if (value === undefined) {
      delete process.env[varName];
    } else {
      process.env[varName] = value;
    }
  }
  return new DatabaseConfig();
}
