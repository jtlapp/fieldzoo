import { Type } from "@sinclair/typebox";

import { SafeValidator } from "@fieldzoo/safe-validator";
import { FieldsOf } from "@fieldzoo/utilities";
import {
  NonEmptyString,
  Nullable,
  SingleLineUniString,
  MultiLineUniString,
} from "@fieldzoo/typebox-types";
import { freezeField } from "@fieldzoo/freeze-field";

import { UserID } from "./user";

/** Database ID of a glossary record */
export type GlossaryID = string & { readonly __typeID: unique symbol };

/**
 * Class representing a valid glossary
 */
export class Glossary {
  readonly id: GlossaryID;
  ownerID: UserID;
  name: string;
  description: string | null;

  static schema = Type.Object({
    id: NonEmptyString(),
    ownerID: NonEmptyString(),
    name: SingleLineUniString({
      minLength: 1,
      maxLength: 100,
    }),
    description: Nullable(MultiLineUniString({ maxLength: 1000 })),
  });
  static #validator = new SafeValidator(this.schema);

  constructor(fields: FieldsOf<Glossary>, assumeValid = false) {
    this.id = fields.id;
    this.ownerID = fields.ownerID;
    this.name = fields.name;
    this.description = fields.description;

    if (!assumeValid) {
      Glossary.#validator.safeValidate(this, "Invalid glossary");
    }
    freezeField(this, "id");
  }
}
export interface Glossary {
  readonly __typeID: unique symbol;
}
