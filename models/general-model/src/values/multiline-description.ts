import { CompilingStandardValidator } from "typebox-validators/standard/index.js";

import { MultiLineUnicodeString } from "@fieldzoo/typebox-types";
import { validate } from "../utils/modeling-utils.js";

/**
 * Multiline unicode description
 */

export type MultilineDescription = string & {
  readonly __validated__: unique symbol;
};

const schema = MultiLineUnicodeString({ minLength: 1, maxLength: 1000 });
const validator = new CompilingStandardValidator(schema);

export function toMultilineDescription(description: string, safely = true) {
  validate(validator, description, "Invalid description", safely);
  return description as MultilineDescription;
}
toMultilineDescription.schema = schema;
