import { Type } from "@sinclair/typebox";

import { SafeValidator } from "@fieldzoo/safe-validator";
import { FieldsOf } from "@fieldzoo/utilities";
import {
  NonEmptyString,
  SingleLineUniString,
  MultiLineUniString,
} from "@fieldzoo/typebox-types";
import { freezeField } from "@fieldzoo/freeze-field";

import { GlossaryID } from "./glossary";

/** Database ID of a term record */
export type TermID = string & { readonly __typeID: unique symbol };

/**
 * Class representing a valid term
 */
export class Term {
  readonly id: TermID;
  glossaryID: GlossaryID;
  name: string;
  description: string;

  static schema = Type.Object({
    id: NonEmptyString(),
    glossaryID: NonEmptyString(),
    name: SingleLineUniString({
      minLength: 1,
      maxLength: 100,
    }),
    description: MultiLineUniString({ minLength: 1, maxLength: 1000 }),
  });
  static #validator = new SafeValidator(this.schema);

  constructor(fields: FieldsOf<Term>, assumeValid = false) {
    this.id = fields.id;
    this.glossaryID = fields.glossaryID;
    this.name = fields.name;
    this.description = fields.description;

    if (!assumeValid) {
      Term.#validator.safeValidate(this, "Invalid term");
    }
    freezeField(this, "id");
  }
}
export interface Term {
  readonly __typeID: unique symbol;
}
