import { UserName } from "./user";

describe("UserName value object", () => {
  it("accepts valid user names", () => {
    expect(() => new UserName("Mo")).not.toThrow();
    expect(() => new UserName("Jimmy")).not.toThrow();
    expect(() => new UserName("Mary Q.")).not.toThrow();
    expect(() => new UserName("Mary Q. Reacher")).not.toThrow();
    expect(() => new UserName("Mary Q. R. Baxter")).not.toThrow();
    expect(() => new UserName("Mary Q.R. Baxter")).not.toThrow();
    expect(() => new UserName("M.Q.R. Baxter")).not.toThrow();
    expect(() => new UserName("Mike O'Brien")).not.toThrow();
    expect(() => new UserName("Mary-Sue Blue-Green")).not.toThrow();
    expect(() => new UserName("Mary-Sue B.-Green")).not.toThrow();
    expect(() => new UserName("Mark Heße")).not.toThrow();
  });

  it("rejects invalid user names", () => {
    expect(() => new UserName("")).toThrow("user name");
    expect(() => new UserName("X")).toThrow("user name");
    expect(() => new UserName("M.")).toThrow("user name");
    expect(() => new UserName("X..Y")).toThrow("user name");
    expect(() => new UserName("X  Y")).toThrow("user name");
    expect(() => new UserName("X--Y")).toThrow("user name");
    expect(() => new UserName(". Foo")).toThrow("user name");
    expect(() => new UserName("-Foo")).toThrow("user name");
    expect(() => new UserName("'Foo")).toThrow("user name");
    expect(() => new UserName("Mike 'Brien")).toThrow("user name");
    expect(() => new UserName("foo@abc.com")).toThrow("user name");
    expect(() => new UserName("x/y")).toThrow("user name");
  });

  it("cannot be changed", () => {
    const userName = new UserName("Jeff Blarg");
    expect(() => ((userName as any).value = "Jeff Blurg")).toThrow("read only");
  });
});
