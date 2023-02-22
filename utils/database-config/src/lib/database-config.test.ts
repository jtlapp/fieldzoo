import { DatabaseConfig } from "./database-config";

import { InvalidEnvironmentError } from "./invalid-env-error";
import { InvalidShapeError } from "@fieldzoo/safe-validator";

const ALL_FIELDS = ["host", "port", "database", "user", "password"];

describe("database configuration", () => {
  it("accepts valid configurations", () => {
    expect(
      () =>
        new DatabaseConfig({
          host: "localhost",
          port: 123,
          database: "foo",
          user: "bar",
          password: "xyz",
        }),
    ).not.toThrow();
    expect(
      () =>
        new DatabaseConfig({
          host: "abc.def.com",
          port: 2001,
          database: "_foo123",
          user: "_bar123",
          password: "d kd #$ !",
        }),
    ).not.toThrow();
  });

  it("rejects undefined values", () => {
    expect.assertions(ALL_FIELDS.length + 1);
    try {
      new DatabaseConfig({
        host: undefined!,
        port: undefined!,
        database: undefined!,
        user: undefined!,
        password: undefined!,
      });
    } catch (err: unknown) {
      if (!(err instanceof InvalidShapeError)) throw err;
      expect(err.details.length).toEqual(ALL_FIELDS.length);
      for (const detail of err.details) {
        expect(ALL_FIELDS).toContain(detail.error.path.substring(1));
      }
    }
  });

  it("rejects null values", () => {
    expect.assertions(ALL_FIELDS.length + 1);
    try {
      new DatabaseConfig({
        host: null!,
        port: null!,
        database: null!,
        user: null!,
        password: null!,
      });
    } catch (err: unknown) {
      if (!(err instanceof InvalidShapeError)) throw err;
      expect(err.details.length).toEqual(ALL_FIELDS.length);
      for (const detail of err.details) {
        expect(ALL_FIELDS).toContain(detail.error.path.substring(1));
      }
    }
  });

  it("rejects empty strings", () => {
    expect.assertions(ALL_FIELDS.length + 1);
    try {
      new DatabaseConfig({
        host: "",
        port: 65536,
        database: "",
        user: "",
        password: "",
      });
    } catch (err: unknown) {
      if (!(err instanceof InvalidShapeError)) throw err;
      expect(err.details.length).toEqual(ALL_FIELDS.length);
      for (const detail of err.details) {
        expect(ALL_FIELDS).toContain(detail.error.path.substring(1));
      }
    }
  });

  it("rejects invalid values", () => {
    expect.assertions(ALL_FIELDS.length);
    try {
      new DatabaseConfig({
        host: "foo foo",
        port: -1,
        database: "bar bar",
        user: "baz baz ",
        password: "abcdef",
      });
    } catch (err: unknown) {
      if (!(err instanceof InvalidShapeError)) throw err;
      const invalids = ["host", "port", "database", "user"];
      expect(err.details.length).toEqual(invalids.length);
      for (const detail of err.details) {
        expect(invalids).toContain(detail.error.path.substring(1));
      }
    }
  });

  it("produces friendly error messages", () => {
    expect.assertions(ALL_FIELDS.length + 1);
    try {
      new DatabaseConfig({
        host: "localhost:32",
        port: 125.5,
        database: "foo bar",
        user: "foo bar",
        password: "",
      });
    } catch (err: unknown) {
      if (!(err instanceof InvalidShapeError)) throw err;
      expect(err.details.length).toEqual(ALL_FIELDS.length);
      expect(err.details[0].toString()).toEqual("invalid host name");
      expect(err.details[1].toString()).toEqual(
        "port must be an integer >= 0 and <= 65535",
      );
      expect(err.details[2].toString()).toEqual("invalid database name");
      expect(err.details[3].toString()).toEqual("invalid user");
      expect(err.details[4].toString()).toEqual("password should not be empty");
    }
  });

  it("loads from valid environment variables", () => {
    process.env.DB_HOST = "my-host.com";
    process.env.DB_PORT = "1001";
    process.env.DB_DATABASE = "my_database";
    process.env.DB_USERNAME = "my_username";
    process.env.DB_PASSWORD = "xyz";

    const config = DatabaseConfig.fromEnv("DB_");
    expect(config.host).toEqual(process.env.DB_HOST);
    expect(config.port).toEqual(parseInt(process.env.DB_PORT));
    expect(config.database).toEqual(process.env.DB_DATABASE);
    expect(config.user).toEqual(process.env.DB_USERNAME);
    expect(config.password).toEqual(process.env.DB_PASSWORD);
  });

  it("fails to load from invalid environment variables", () => {
    process.env.DB_HOST = "localhost:1000";
    process.env.DB_PORT = "";
    process.env.DB_DATABASE = "my database";
    process.env.DB_USERNAME = "my user";
    process.env.DB_PASSWORD = "";

    try {
      DatabaseConfig.fromEnv("DB_");
    } catch (err: any) {
      expect(err).toBeInstanceOf(InvalidEnvironmentError);
      expect(err.errors).toEqual([
        {
          envVarName: "DB_HOST",
          errorMessage: "invalid host name",
        },
        {
          envVarName: "DB_PORT",
          errorMessage: "port must be an integer >= 0 and <= 65535",
        },
        {
          envVarName: "DB_DATABASE",
          errorMessage: "invalid database name",
        },
        {
          envVarName: "DB_USERNAME",
          errorMessage: "invalid user",
        },
        {
          envVarName: "DB_PASSWORD",
          errorMessage: "password should not be empty",
        },
      ]);
    }
  });
});
