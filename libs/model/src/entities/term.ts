import { Type } from "@sinclair/typebox";

import { SelectivePartial, UnvalidatedFields } from "@fieldzoo/generic-types";
import {
  MultitierValidator,
  ValidationException,
} from "@fieldzoo/multitier-validator";
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
  #displayName: DisplayName;
  #lookupName?: NormalizedName; // generated on demand

  static schema = Type.Object({
    id: Zeroable(TermIDImpl.schema),
    lookupName: Type.Optional(NormalizedNameImpl.schema),
    glossaryId: GlossaryIDImpl.schema,
    displayName: DisplayNameImpl.schema,
    description: MultilineDescriptionImpl.schema,
    updatedBy: UserIDImpl.schema,
  });
  static #validator = new MultitierValidator(this.schema);

  /**
   * @param glossaryId The ID of the glossary this term belongs to.
   * @param displayName The term's display name.
   * @param description The term's description.
   * @param updatedBy The ID of the user who last updated this term.
   * @param lookupName The term's name, normalized for lookup.
   *  Computed from displayName on demand when not provided.
   */
  constructor(
    readonly id: TermID,
    readonly glossaryId: GlossaryID,
    displayName: DisplayName,
    public description: MultilineDescription,
    public updatedBy: UserID,
    lookupName?: NormalizedName
  ) {
    freezeField(this, "id");
    freezeField(this, "glossaryId");
    this.#displayName = displayName;
    this.#lookupName = lookupName;
  }

  /**
   * Create a new term, optionally with validation.
   * @param fields The term's properties. `id` and `lookupName` are optional.
   *  `id` defaults to 0 for terms not yet in the database. `lookupName`
   *  derives from `displayName` when not provided.
   * @param validate Whether to validate the fields. Defaults to true.
   * @returns A new term.
   */
  static create(
    fields: Readonly<
      SelectivePartial<
        UnvalidatedFields<Term> & {
          displayName: string;
          lookupName: string;
        },
        "id" | "lookupName"
      >
    >,
    validate = true
  ) {
    if (fields.id === undefined) {
      fields = { ...fields, id: 0 };
    }
    if (validate) {
      this.#validator.safeValidate(fields, "Invalid term");
      if (
        fields.lookupName !== undefined &&
        fields.lookupName !=
          NormalizedNameImpl.create(fields.displayName as DisplayName)
      ) {
        throw new ValidationException(
          "lookupName is inconsistent with displayName"
        );
      }
    }
    return new Term(
      fields.id as TermID,
      fields.glossaryId as GlossaryID,
      fields.displayName as DisplayName,
      fields.description as MultilineDescription,
      fields.updatedBy as UserID,
      fields.lookupName as NormalizedName
    );
  }

  /**
   * Returns the display name.
   * @returns The display name.
   */
  get displayName() {
    return this.#displayName;
  }

  /**
   * Sets the display name and resets the lookup name.
   * @param value The new display name.
   */
  set displayName(value: DisplayName) {
    this.#displayName = value;
    this.#lookupName = undefined;
  }

  /**
   * Returns the lookup name.
   * @returns The lookup name.
   */
  get lookupName() {
    if (this.#lookupName === undefined) {
      this.#lookupName = NormalizedNameImpl.create(this.#displayName);
    }
    return this.#lookupName;
  }
}
export interface Term {
  readonly __typeID: unique symbol;
}
