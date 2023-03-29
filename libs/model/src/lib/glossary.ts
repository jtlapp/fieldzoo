import { Type } from "@sinclair/typebox";

import { FieldsOf, SelectivePartial } from "@fieldzoo/generic-types";
import { KeyedObject } from "@fieldzoo/kysely-lenses";
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
export class Glossary implements KeyedObject<Glossary, ["uuid"]> {
  readonly uuid: GlossaryID;
  ownerId: UserID;
  name: string;
  description: string | null;
  updatedBy: UserID;

  static schema = Type.Object({
    uuid: Type.String(),
    ownerId: Type.Number({ minimum: 1 }),
    name: SingleLineUniString({
      minLength: 1,
      maxLength: 100,
    }),
    description: Nullable(MultiLineUniString({ maxLength: 1000 })),
    updatedBy: Type.Number({ minimum: 1 }),
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
    this.name = fields.name;
    this.description = fields.description;
    this.updatedBy = fields.updatedBy;

    if (!assumeValid) {
      Glossary.#validator.safeValidate(this, "Invalid glossary");
    }
    freezeField(this, "uuid");
  }

  /**
   * Returns the glossary's UUID.
   * @returns the glossary's UUID.
   */
  getKey(): [GlossaryID] {
    return [this.uuid];
  }
}
export interface Glossary {
  readonly __typeID: unique symbol;
}
