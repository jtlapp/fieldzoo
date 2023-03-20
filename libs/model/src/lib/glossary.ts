import { Type } from "@sinclair/typebox";

import { FieldsOf, SelectivePartial } from "@fieldzoo/generic-types";
import { SafeValidator } from "@fieldzoo/safe-validator";
import {
  Nullable,
  SingleLineUniString,
  MultiLineUniString,
} from "@fieldzoo/typebox-types";
import { freezeField } from "@fieldzoo/freeze-field";

import { UserID } from "./user";

/** Database ID of a glossary record */
export type GlossaryID = string & { readonly __typeID: unique symbol };

/**
 * Class representing a valid glossary.
 */
export class Glossary {
  readonly uuid: GlossaryID;
  ownerId: UserID;
  updatedBy: UserID;
  name: string;
  description: string | null;

  static schema = Type.Object({
    uuid: Type.String(),
    ownerId: Type.Number({ minimum: 1 }),
    updatedBy: Type.Number({ minimum: 1 }),
    name: SingleLineUniString({
      minLength: 1,
      maxLength: 100,
    }),
    description: Nullable(MultiLineUniString({ maxLength: 1000 })),
  });
  static #validator = new SafeValidator(this.schema);

  /**
   * Creates a new glossary.
   * @param fields - Fields of the glossary. `uuid` is optional, but
   *  must be an empty string for users not yet in the database.
   */
  constructor(
    fields: SelectivePartial<FieldsOf<Glossary>, "uuid">,
    assumeValid = false
  ) {
    this.uuid = fields.uuid ?? ("" as GlossaryID);
    this.ownerId = fields.ownerId;
    this.updatedBy = fields.updatedBy;
    this.name = fields.name;
    this.description = fields.description;

    if (!assumeValid) {
      Glossary.#validator.safeValidate(this, "Invalid glossary");
    }
    freezeField(this, "uuid");
  }
}
export interface Glossary {
  readonly __typeID: unique symbol;
}
