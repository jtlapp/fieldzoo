import { Type } from "@sinclair/typebox";
import { CompilingStandardValidator } from "typebox-validators/standard/index.js";

/**
 * Access levels users can have to resources. Each level includes all the
 * permissions of the levels below it. Inserting new levels requires
 * updating the levels recorded in the database.
 */
export enum AccessLevel {
  None, // 0
  List, // 1
  Read, // 2
  Comment, // 3
  Create, // 4
  Edit, // 5
  Delete, // 6
  Grant, // 7
  Owner, // 8
}

const schema = Type.Integer({
  minimum: AccessLevel.None,
  maximum: AccessLevel.Owner,
});
const validator = new CompilingStandardValidator(schema);

export function toAccessLevel(permissions: number) {
  validator.assert(permissions, "Invalid permissions");
  return permissions as AccessLevel;
}
toAccessLevel.schema = schema;
