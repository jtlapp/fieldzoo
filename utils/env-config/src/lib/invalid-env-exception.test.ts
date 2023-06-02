import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

import { InvalidEnvironmentException } from "./invalid-env-exception";

describe("invalid environment exception", () => {
  it("can be constructed from a single error", () => {
    const error = new InvalidEnvironmentException();
    error.add({
      envVarName: "FOO",
      errorMessage: "invalid value",
    });
    expect(error.toString()).toEqual(
      "Invalid environment variable(s):\n  FOO: invalid value"
    );
  });

  it("can be constructed from multiple errors", () => {
    const error = new InvalidEnvironmentException();
    error.add({
      envVarName: "FOO",
      errorMessage: "invalid value",
    });
    error.add({
      envVarName: "BAR",
      errorMessage: "invalid value",
    });
    expect(error.toString()).toEqual(
      "Invalid environment variable(s):\n  FOO: invalid value\n  BAR: invalid value"
    );
  });

  it("can be constructed from typebox errors", () => {
    const schema = Type.Object({
      FOO: Type.Integer({
        description: "foo",
        message: "invalid foo",
      }),
      BAR: Type.Integer({
        description: "bar",
        message: "invalid bar",
        minimum: 1,
      }),
    });
    const error = InvalidEnvironmentException.fromTypeBoxErrors([
      ...Value.Errors(schema, {
        FOO: "foo",
        BAR: 0,
      }),
    ]);

    expect(error.errors).toEqual([
      {
        envVarName: "FOO",
        errorMessage: "invalid foo",
      },
      {
        envVarName: "BAR",
        errorMessage: "invalid bar",
      },
    ]);
    expect(error.toString()).toEqual(
      "Invalid environment variable(s):\n  FOO: invalid foo\n  BAR: invalid bar"
    );
  });

  it("reports only the first error for each environment variable", () => {
    const schema = Type.Object({
      FOO: Type.Union(
        [
          Type.RegEx(/^[1-4]$/, {
            message: "not 1-4",
          }),
          Type.RegEx(/^[5-8]$/, {
            message: "not 5-8",
          }),
        ],
        {
          message: "just invalid",
        }
      ),
    });
    const error = InvalidEnvironmentException.fromTypeBoxErrors([
      ...Value.Errors(schema, { FOO: "0" }),
    ]);

    expect(error.errors).toEqual([
      {
        envVarName: "FOO",
        errorMessage: "just invalid",
      },
    ]);
    expect(error.toString()).toEqual(
      "Invalid environment variable(s):\n  FOO: just invalid"
    );
  });
});
