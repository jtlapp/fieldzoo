import { Type } from "@sinclair/typebox";
import { CompilingStandardValidator } from "typebox-validators";

/**
 * Level of visibility
 */

const MAX_VISIBILITY = 2;

export const Visibility = {
  Private: 0,
  Listed: 1,
  Readable: MAX_VISIBILITY,
} as const;

export type VersionNumber = number & { readonly __validated__: unique symbol };

export class VersionNumberImpl {
  static schema = Type.Integer({ minimum: 1 });

  static castFrom(versionNumber: number) {
    this.#validator.assert(versionNumber, "Invalid version number");
    return versionNumber as VersionNumber;
  }

  static #validator = new CompilingStandardValidator(this.schema);
}

function foo(v: V2) {
  console.log(v);
}

function bar(n: number) {
  foo(n);
}
