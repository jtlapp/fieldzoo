import { Type } from "@sinclair/typebox";

import { MultitierValidator } from "@fieldzoo/multitier-validator";

/**
 * Representation of an entity version number
 */

export type VersionNumber = number & { readonly __validated__: unique symbol };

export class VersionNumberImpl {
  static schema = Type.Integer({ minimum: 1 });

  static castFrom(version: number) {
    this.#validator.validate(version, "Invalid version number");
    return version as VersionNumber;
  }

  static #validator = new MultitierValidator(this.schema);
}
