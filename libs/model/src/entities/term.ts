import { Type } from "@sinclair/typebox";

import { SelectivePartial, UnvalidatedFields } from "@fieldzoo/generic-types";
import { MultitierValidator } from "@fieldzoo/multitier-validator";
import { freezeField } from "@fieldzoo/freeze-field";

import { DisplayName, DisplayNameImpl } from "../values/display-name";
import { GlossaryID, GlossaryIDImpl } from "../values/glossary-id";
import {
  MultilineDescription,
  MultilineDescriptionImpl,
} from "../values/multiline-description";
import { UserID, UserIDImpl } from "../values/user-id";
import { NormalizedName, NormalizedNameImpl } from "../values/normalized-name";
import { TermID, TermIDImpl } from "../values/term-id";
import { Zeroable } from "@fieldzoo/typebox-types";

/**
 * Class representing a valid term
 */
export class Term {
  static schema = Type.Object({
    id: Zeroable(TermIDImpl.schema),
    glossaryId: GlossaryIDImpl.schema,
    lookupName: NormalizedNameImpl.schema,
    displayName: DisplayNameImpl.schema,
    description: MultilineDescriptionImpl.schema,
    updatedBy: UserIDImpl.schema,
  });
  static #validator = new MultitierValidator(this.schema);

  /**
   * @param glossaryId The ID of the glossary this term belongs to.
   * @param lookupName The term's name, normalized for lookup.
   * @param displayName The term's display name.
   * @param description The term's description.
   * @param updatedBy The ID of the user who last updated this term.
   */
  constructor(
    readonly id: TermID,
    readonly glossaryId: GlossaryID,
    public lookupName: NormalizedName,
    public displayName: DisplayName,
    public description: MultilineDescription,
    public updatedBy: UserID
  ) {
    freezeField(this, "id");
    freezeField(this, "glossaryId");
  }

  /**
   * Create a new term, optionally with validation.
   * @param fields The term's properties. `uuid` is optional, defaulting to
   *  the empty string for terms not yet in the database.
   * @param assumeValid Whether to skip validation.
   * @returns A new term.
   */
  static create(
    fields: Readonly<SelectivePartial<UnvalidatedFields<Term>, "id">>,
    assumeValid = false
  ) {
    if (fields.id === undefined) {
      fields = { ...fields, id: 0 };
    }
    if (!assumeValid) {
      this.#validator.safeValidate(fields, "Invalid term");
    }
    return new Term(
      fields.id as TermID,
      fields.glossaryId as GlossaryID,
      fields.lookupName as NormalizedName,
      fields.displayName as DisplayName,
      fields.description as MultilineDescription,
      fields.updatedBy as UserID
    );
  }
}
export interface Term {
  readonly __typeID: unique symbol;
}
