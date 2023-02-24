import { Type } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";

import { EmailString } from "./regex-types";

export class Email {
  email: string;

  static schema = Type.Object({
    email: EmailString({ maxLength: 100 }),
  });
  static #compiledSchema = TypeCompiler.Compile(this.schema);

  constructor(email: string) {
    this.email = email;
    if (!Email.#compiledSchema.Check(this)) {
      throw Error("Invalid email");
    }
  }
}

describe("email test", () => {
  it("accepts a valid email", () => {
    expect(() => new Email("foo@bar.com")).not.toThrow();
  });

  it("rejects an invalid email", () => {
    expect(() => new Email(".dkf3-$zz.")).toThrow("Invalid email");
  });

  // TODO: more tests
});
