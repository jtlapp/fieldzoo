import { EmailAddress } from "./value-objects";

describe("EmailAddress value object", () => {
  it("accepts valid emails", () => {
    expect(() => new EmailAddress("foo@abc.com")).not.toThrow();
    expect(() => new EmailAddress("foo.bar@xyz.abc.co")).not.toThrow();
    expect(() => new EmailAddress("foo-bar@xyz-abc.co")).not.toThrow();
  });

  it("rejects invalid emails", () => {
    expect(() => new EmailAddress("")).toThrow("email");
    expect(() => new EmailAddress("foo")).toThrow("email");
    expect(() => new EmailAddress("foo@abc")).toThrow("email");
    expect(() => new EmailAddress("foo bar@abc")).toThrow("email");
    expect(() => new EmailAddress("foo@abc def")).toThrow("email");
  });

  it("cannot be changed", () => {
    const email = new EmailAddress("foo@abc.com");
    expect(() => ((email as any).value = "bar@def.com")).toThrow("read only");
  });
});
