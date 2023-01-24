import { UserName, MAX_USER_NAME_LENGTH } from "./user";

describe("UserName value object", () => {
  // The regex itself is already well tested elsewhere.

  it("accepts valid user names", () => {
    expect(() => new UserName("Mo")).not.toThrow();
    expect(() => new UserName("Jimmy")).not.toThrow();
    expect(() => new UserName("Mary Q.")).not.toThrow();
    expect(() => new UserName("Mary Q. Reacher")).not.toThrow();
    expect(() => new UserName("Mark Heüße")).not.toThrow();
    const maxLength = "A".repeat(MAX_USER_NAME_LENGTH);
    expect(() => new UserName(maxLength)).not.toThrow();
  });

  it("rejects invalid user names", () => {
    expect(() => new UserName("")).toThrow("user name");
    expect(() => new UserName("X")).toThrow("user name");
    expect(() => new UserName("x/y")).toThrow("user name");
    const tooLong = "A".repeat(MAX_USER_NAME_LENGTH + 1);
    expect(() => new UserName(tooLong)).toThrow("user name");
  });

  it("cannot be changed", () => {
    const userName = new UserName("Jeff Blarg");
    expect(() => ((userName as any).value = "Jeff Blurg")).toThrow("read only");
  });
});
