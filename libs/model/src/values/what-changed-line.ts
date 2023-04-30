import { MultitierValidator } from "@fieldzoo/multitier-validator";
import { SingleLineUnicodeString } from "@fieldzoo/typebox-types";

/**
 * Line describing what changed for a version.
 */

export type WhatChangedLine = string & {
  readonly __validated__: unique symbol;
};

export class WhatChangedLineeImpl {
  static schema = SingleLineUnicodeString({
    minLength: 1,
    maxLength: 240,
  });

  static castFrom(name: string, safely = true) {
    this.#validator.validate(name, "Invalid what-changed line", safely);
    return name as WhatChangedLine;
  }

  static #validator = new MultitierValidator(this.schema);
}
