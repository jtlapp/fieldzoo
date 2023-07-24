import { CompilingStandardValidator } from "typebox-validators";

import { Base64UuidSchema } from "@fieldzoo/base64-uuid";

/**
 * Representation of a user ID, a base-64 encoded UUID.
 */

export type UserID = string & { readonly __validated__: unique symbol };

const schema = Base64UuidSchema;
const validator = new CompilingStandardValidator(schema);

export function toUserID(id: string) {
  validator.assert(id, "Invalid user ID");
  return id as UserID;
}
toUserID.schema = schema;
