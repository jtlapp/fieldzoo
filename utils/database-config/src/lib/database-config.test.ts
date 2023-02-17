/* eslint-disable turbo/no-undeclared-env-vars */

import { DatabaseConfig } from "./database-config";

import { expectInvalid } from "@fieldzoo/validation";

import { InvalidEnvironmentError } from "./invalid-env-error";

describe("database configuration", () => {
  // The regex itself is already well tested elsewhere.

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

  it("rejects invalid configurations", () => {
    expectInvalid(
      expect,
      () =>
        new DatabaseConfig({
          host: undefined!,
          port: undefined!,
          database: undefined!,
          user: undefined!,
          password: undefined!,
        }),
      ["host", "port", "database", "user", "password"],
    );
    expectInvalid(
      expect,
      () =>
        new DatabaseConfig({
          host: null!,
          port: null!,
          database: null!,
          user: null!,
          password: null!,
        }),
      ["host", "port", "database", "user", "password"],
    );
    expectInvalid(
      expect,
      () =>
        new DatabaseConfig({
          host: "",
          port: 65536,
          database: "",
          user: "",
          password: "",
        }),
      ["host", "port", "database", "user", "password"],
    );
    expectInvalid(
      expect,
      () =>
        new DatabaseConfig({
          host: "foo foo",
          port: -1,
          database: "bar bar",
          user: "baz baz ",
          password: "abcdef",
        }),
      ["host", "port", "database", "user"],
    );
    expectInvalid(
      expect,
      () =>
        new DatabaseConfig({
          host: "localhost:32",
          port: 9.5,
          database: "*",
          user: "*",
          password: "adfadfad",
        }),
      ["host", "port", "database", "user"],
    );
  });

  it("produces friendly error messages", () => {
    expectInvalid(
      expect,
      () =>
        new DatabaseConfig({
          host: "localhost:32",
          port: 123,
          database: "foo",
          user: "bar",
          password: "xyz",
        }),
      ["invalid host name"],
    );
    expectInvalid(
      expect,
      () =>
        new DatabaseConfig({
          host: "localhost",
          port: 65536,
          database: "foo",
          user: "bar",
          password: "xyz",
        }),
      ["port must be a number >= 0 and <= 65535"],
    );
    expectInvalid(
      expect,
      () =>
        new DatabaseConfig({
          host: "localhost",
          port: 1000,
          database: "foo bar",
          user: "bar",
          password: "xyz",
        }),
      ["invalid database name"],
    );
    expectInvalid(
      expect,
      () =>
        new DatabaseConfig({
          host: "localhost",
          port: 1000,
          database: "foo",
          user: "foo bar",
          password: "xyz",
        }),
      ["invalid user"],
    );
    expectInvalid(
      expect,
      () =>
        new DatabaseConfig({
          host: "localhost",
          port: 1000,
          database: "foo",
          user: "bar",
          password: "",
        }),
      ["password should not be empty"],
    );
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
          errorMessage: "port must be a number >= 0 and <= 65535",
        },
        {
          envVarName: "DB_DATABASE",
          errorMessage: "invalid database name",
        },
        {
          envVarName: "DB_USERNAME",
          errorMessage: "invalid user name",
        },
        {
          envVarName: "DB_PASSWORD",
          errorMessage: "password should not be empty",
        },
      ]);
    }
  });
});
