import { CompilingStandardValidator } from "typebox-validators";

import { SingleLineUnicodeString } from "@fieldzoo/typebox-types";
import { validate } from "@fieldzoo/general-model";

/**
 * Line describing what changed for a version.
 */

export type WhatChangedLine = string & {
  readonly __validated__: unique symbol;
};

const schema = SingleLineUnicodeString({
  minLength: 1,
  maxLength: 240,
});
const validator = new CompilingStandardValidator(schema);

export function toWhatChangedLine(name: string, safely = true) {
  validate(validator, name, "Invalid what-changed line", safely);
  return name as WhatChangedLine;
}
toWhatChangedLine.schema = schema;
