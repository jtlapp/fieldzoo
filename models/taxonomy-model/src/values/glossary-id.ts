import { CompilingStandardValidator } from "typebox-validators";

import { Base64UuidSchema } from "@fieldzoo/base64-uuid";

/**
 * Representation of a glossary ID
 */

export type GlossaryID = string & { readonly __validated__: unique symbol };

const schema = Base64UuidSchema;
const validator = new CompilingStandardValidator(schema);

export function toGlossaryID(id: string) {
  validator.assert(id, "Invalid glossary ID");
  return id as GlossaryID;
}
toGlossaryID.schema = schema;
