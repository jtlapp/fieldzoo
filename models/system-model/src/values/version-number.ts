import { Type } from "@sinclair/typebox";
import { CompilingStandardValidator } from "typebox-validators";

/**
 * Representation of an entity version number
 */

export type VersionNumber = number & { readonly __validated__: unique symbol };

const schema = Type.Integer({ minimum: 1 });
const validator = new CompilingStandardValidator(schema);

export function toVersionNumber(versionNumber: number) {
  validator.assert(versionNumber, "Invalid version number");
  return versionNumber as VersionNumber;
}
toVersionNumber.schema = schema;
