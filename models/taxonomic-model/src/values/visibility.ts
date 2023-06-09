import { Type } from "@sinclair/typebox";
import { CompilingStandardValidator } from "typebox-validators";

/**
 * Level of visibility
 */

const MAX_VISIBILITY = 2;

// TODO: look at making this an enum, basing on AccessLevel
export const Visibility = {
  Private: 0,
  Listed: 1,
  Readable: MAX_VISIBILITY,
} as const;
export type Visibility = (typeof Visibility)[keyof typeof Visibility];

export class VisibilityImpl {
  static schema = Type.Integer({ minimum: 0, maximum: MAX_VISIBILITY });

  static castFrom(visibility: number) {
    this.#validator.assert(visibility, "Invalid visibility");
    return visibility as Visibility;
  }

  static #validator = new CompilingStandardValidator(this.schema);
}
