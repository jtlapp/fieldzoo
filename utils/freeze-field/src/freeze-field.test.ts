import { freezeField } from "./freeze-field";

class TestObj {
  constructor(public id: string, public value: number) {
    freezeField(this, "id");
  }
}

describe("freezefield()", () => {
  it("prevents a field from being changed", () => {
    const testObj = new TestObj("abc", 1);
    expect(() => ((testObj as any).id = "xyz")).toThrow("read only");
    expect(testObj.id).toEqual("abc");
    testObj.value = 32;
    expect(testObj.value).toEqual(32);
  });
});
