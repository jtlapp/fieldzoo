import { testBase64Uuid } from "@fieldzoo/testing-utils";

import { toGlossaryID } from "../values/glossary-id";

it("accepts only valid glosssary IDs", () => {
  testGlossaryID("Invalid glossary ID", (value) => toGlossaryID(value));
});

export function testGlossaryID(
  errorSubstring: string,
  test: (value: any) => void,
  exclude = (_skip: any) => false
) {
  testBase64Uuid(errorSubstring, test, exclude);
}
