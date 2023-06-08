import { PostgresConfig } from "./postgres-config";

import { setTestEnvVariables } from "./set-test-env-variables";
import { InvalidEnvironmentException } from "./invalid-env-exception";

const COMMON_VARS = [
  "POSTGRES_DATABASE",
  "POSTGRES_USER",
  "POSTGRES_PASSWORD",
  "POSTGRES_MAX_CONNECTIONS",
];
const URL_VARS = ["POSTGRES_URL", ...COMMON_VARS];
const HOST_VARS = ["POSTGRES_HOST", "POSTGRES_PORT", ...COMMON_VARS];
const ALL_VARS = [...new Set([...URL_VARS, ...HOST_VARS]).values()];

describe("database configuration", () => {
  it("accepts valid configurations", () => {
    let config = createConfig({
      POSTGRES_HOST: "localhost",
      POSTGRES_PORT: "123",
      POSTGRES_DATABASE: "foo",
      POSTGRES_USER: "bar",
      POSTGRES_PASSWORD: "xyz",
    });
    expect(config).toEqual({
      connectinString: undefined,
      host: "localhost",
      port: 123,
      database: "foo",
      user: "bar",
      password: "xyz",
      max: undefined,
    });

    config = createConfig({
      POSTGRES_HOST: "abc.def.com",
      POSTGRES_PORT: "2001",
      POSTGRES_DATABASE: "_foo123",
      POSTGRES_USER: "_bar123",
      POSTGRES_PASSWORD: "d kd #$ !",
      POSTGRES_MAX_CONNECTIONS: "10",
    });
    expect(config).toEqual({
      connectinString: undefined,
      host: "abc.def.com",
      port: 2001,
      database: "_foo123",
      user: "_bar123",
      password: "d kd #$ !",
      max: 10,
    });
  });

  it("rejects undefined values", () => {
    const varCount = HOST_VARS.length - 2;
    expect.assertions(varCount + 1);
    try {
      createConfig({ POSTGRES_HOST: "localhost" });
    } catch (e: unknown) {
      if (!(e instanceof InvalidEnvironmentException)) throw e;
      expect(e.errors.length).toEqual(varCount);
      for (const error of e.errors) {
        expect(HOST_VARS).toContain(error.envVarName);
      }
    }
  });

  it("rejects empty strings", () => {
    const varCount = 5;
    expect.assertions(varCount + 2);
    try {
      createConfig({
        POSTGRES_HOST: "localhost:123",
        POSTGRES_PORT: "65536",
        POSTGRES_DATABASE: "",
        POSTGRES_USER: "",
        POSTGRES_PASSWORD: "",
      });
    } catch (e: unknown) {
      if (!(e instanceof InvalidEnvironmentException)) throw e;
      expect(e.errors.length).toEqual(varCount);
      for (const error of e.errors) {
        expect(HOST_VARS).toContain(error.envVarName);
      }
      expect(
        e.errors.find((e) => e.envVarName === "POSTGRES_MAX_CONNECTIONS")
      ).not.toBeDefined();
    }
  });

  it("rejects invalid values", () => {
    const varCount = 5;
    expect.assertions(varCount + 2);
    try {
      createConfig({
        POSTGRES_HOST: "foo foo",
        POSTGRES_PORT: "-1",
        POSTGRES_DATABASE: "bar bar",
        POSTGRES_USER: "baz baz ",
        POSTGRES_PASSWORD: "abcdef",
        POSTGRES_MAX_CONNECTIONS: "0",
      });
    } catch (e: unknown) {
      if (!(e instanceof InvalidEnvironmentException)) throw e;
      expect(e.errors.length).toEqual(varCount);
      for (const error of e.errors) {
        expect(HOST_VARS).toContain(error.envVarName);
      }
      expect(
        e.errors.find((e) => e.envVarName === "POSTGRES_MAX_CONNECTIONS")
      ).toBeDefined();
    }
  });

  it("produces friendly error messages", () => {
    expect.assertions(1);
    try {
      createConfig({
        POSTGRES_HOST: "localPOSTGRES_HOST:32",
        POSTGRES_PORT: "125.5",
        POSTGRES_DATABASE: "foo bar",
        POSTGRES_USER: "foo bar",
        POSTGRES_PASSWORD: "",
        POSTGRES_MAX_CONNECTIONS: "ABC",
      });
    } catch (e: unknown) {
      if (!(e instanceof InvalidEnvironmentException)) throw e;
      expect(e.errors).toEqual([
        {
          envVarName: "POSTGRES_HOST",
          errorMessage: "Invalid host name",
        },
        {
          envVarName: "POSTGRES_PORT",
          errorMessage: "Port must be an integer >= 0 and <= 65535",
        },
        {
          envVarName: "POSTGRES_DATABASE",
          errorMessage: "Invalid database name",
        },
        {
          envVarName: "POSTGRES_USER",
          errorMessage: "Invalid user",
        },
        {
          envVarName: "POSTGRES_PASSWORD",
          errorMessage: "Password should not be empty",
        },
        {
          envVarName: "POSTGRES_MAX_CONNECTIONS",
          errorMessage: "Max connections must be an integer >= 1",
        },
      ]);
    }
  });
});

function createConfig(vars: Record<string, string>) {
  setTestEnvVariables(ALL_VARS, vars);
  return new PostgresConfig();
}
