import { CompilingStandardValidator } from "typebox-validators";

import { SingleLineUnicodeString } from "@fieldzoo/typebox-types";
import { validate } from "@fieldzoo/modeling";

/**
 * Line describing what changed for a version.
 */

export type WhatChangedLine = string & {
  readonly __validated__: unique symbol;
};

export class WhatChangedLineImpl {
  static schema = SingleLineUnicodeString({
    minLength: 1,
    maxLength: 240,
  });

  static castFrom(name: string, safely = true) {
    validate(this.#validator, name, "Invalid what-changed line", safely);
    return name as WhatChangedLine;
  }

  static #validator = new CompilingStandardValidator(this.schema);
}
