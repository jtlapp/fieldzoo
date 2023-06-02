import { Type } from "@sinclair/typebox";
import { CompilingStandardValidator } from "typebox-validators";

/**
 * Representation of an entity version number
 */

export type VersionNumber = number & { readonly __validated__: unique symbol };

export class VersionNumberImpl {
  static schema = Type.Integer({ minimum: 1 });

  static castFrom(versionNumber: number) {
    this.#validator.assert(versionNumber, "Invalid version number");
    return versionNumber as VersionNumber;
  }

  static #validator = new CompilingStandardValidator(this.schema);
}
