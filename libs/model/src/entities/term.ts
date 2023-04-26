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
import { TermID, TermIDImpl } from "../values/term-id";
import { UserID, UserIDImpl } from "../values/user-id";
import { EmptyStringable } from "@fieldzoo/typebox-types";

/**
 * Class representing a valid term
 */
export class Term {
  static schema = Type.Object({
    uuid: EmptyStringable(TermIDImpl.schema),
    glossaryId: GlossaryIDImpl.schema,
    name: DisplayNameImpl.schema,
    description: MultilineDescriptionImpl.schema,
    updatedBy: UserIDImpl.schema,
  });
  static #validator = new MultitierValidator(this.schema);

  /**
   * @param uuid The term's UUID.
   * @param glossaryId The ID of the glossary this term belongs to.
   * @param name The term's name.
   * @param description The term's description.
   * @param updatedBy The ID of the user who last updated this term.
   */
  constructor(
    readonly uuid: TermID,
    public glossaryId: GlossaryID,
    public name: DisplayName,
    public description: MultilineDescription,
    public updatedBy: UserID
  ) {
    freezeField(this, "uuid");
  }

  /**
   * Create a new term, optionally with validation.
   * @param fields The term's properties. `uuid` is optional, defaulting to
   *  the empty string for terms not yet in the database.
   * @param assumeValid Whether to skip validation.
   * @returns A new term.
   */
  static create(
    fields: Readonly<SelectivePartial<UnvalidatedFields<Term>, "uuid">>,
    assumeValid = false
  ) {
    if (fields.uuid === undefined) {
      fields = { ...fields, uuid: "" };
    }
    if (!assumeValid) {
      this.#validator.safeValidate(fields, "Invalid term");
    }
    return new Term(
      fields.uuid as TermID,
      fields.glossaryId as GlossaryID,
      fields.name as DisplayName,
      fields.description as MultilineDescription,
      fields.updatedBy as UserID
    );
  }
}
export interface Term {
  readonly __typeID: unique symbol;
}
