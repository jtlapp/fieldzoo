import { Type } from "@sinclair/typebox";

import { CompilingStandardValidator } from "typebox-validators";

/**
 * Representation of a term ID
 */

export type TermID = number & { readonly __validated__: unique symbol };

const schema = Type.Integer({ minimum: 1 });
const validator = new CompilingStandardValidator(schema);

export function toTermID(id: number) {
  validator.assert(id, "Invalid term ID");
  return id as TermID;
}
toTermID.schema = schema;
