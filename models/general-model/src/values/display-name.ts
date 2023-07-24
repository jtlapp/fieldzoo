import { CompilingStandardValidator } from "typebox-validators/standard/index.js";

import { SingleLineUnicodeString } from "@fieldzoo/typebox-types";
import { validate } from "../utils/modeling-utils.js";

/**
 * Displayable entity name, not necessarily normalized.
 */

export type DisplayName = string & { readonly __validated__: unique symbol };

const schema = SingleLineUnicodeString({
  minLength: 1,
  maxLength: 100,
});
const validator = new CompilingStandardValidator(schema);

export function toDisplayName(name: string, safely = true) {
  validate(validator, name, "Invalid display name", safely);
  return name as DisplayName;
}
toDisplayName.schema = schema;
