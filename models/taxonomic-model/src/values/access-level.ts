import { Type } from "@sinclair/typebox";
import { CompilingStandardValidator } from "typebox-validators";

/**
 * Access levels users can have to resources. Each level includes all the
 * permissions of the levels below it. Inserting new levels requires
 * updating the levels recorded in the database.
 */
export enum AccessLevel {
  None, // 0
  Read, // 1
  Comment, // 2
  Edit, // 3
  Delete, // 4
  Grant, // 5
}

export class AccessLevelImpl {
  static schema = Type.Integer({
    minimum: AccessLevel.None,
    maximum: AccessLevel.Grant,
  });

  static castFrom(accessLevel: number) {
    this.#validator.assert(accessLevel, "Invalid access level");
    return accessLevel as AccessLevel;
  }

  static #validator = new CompilingStandardValidator(this.schema);
}
