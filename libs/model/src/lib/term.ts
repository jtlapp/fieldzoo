import { Type } from "@sinclair/typebox";

import { FieldsOf, SelectivePartial } from "@fieldzoo/generic-types";
import { TableObject } from "@fieldzoo/kysely-lenses";
import { SafeValidator } from "@fieldzoo/safe-validator";
import {
  NonEmptyString,
  SingleLineUniString,
  MultiLineUniString,
} from "@fieldzoo/typebox-types";
import { freezeField } from "@fieldzoo/freeze-field";

import { GlossaryID } from "./glossary";
import { UserID } from "./user";

/** Database ID of a term record */
export type TermID = string & { readonly __typeID: unique symbol };

/**
 * Class representing a valid term
 */
export class Term implements TableObject<Term, ["uuid"]> {
  readonly uuid: TermID;
  glossaryId: GlossaryID;
  name: string;
  description: string;
  updatedBy: UserID;

  static schema = Type.Object({
    uuid: Type.String(),
    glossaryId: NonEmptyString(),
    name: SingleLineUniString({
      minLength: 1,
      maxLength: 100,
    }),
    description: MultiLineUniString({ minLength: 1, maxLength: 1000 }),
    updatedBy: Type.Number({ minimum: 1 }),
  });
  static #validator = new SafeValidator(this.schema);

  constructor(
    fields: SelectivePartial<FieldsOf<Term>, "uuid">,
    assumeValid = false
  ) {
    this.uuid = fields.uuid ?? ("" as TermID);
    this.glossaryId = fields.glossaryId;
    this.name = fields.name;
    this.description = fields.description;
    this.updatedBy = fields.updatedBy;

    if (!assumeValid) {
      Term.#validator.safeValidate(this, "Invalid term");
    }
    freezeField(this, "uuid");
  }

  /**
   * Returns the term's UUID.
   * @returns The term's UUID.
   */
  getKey(): [TermID] {
    return [this.uuid];
  }
}
export interface Term {
  readonly __typeID: unique symbol;
}
