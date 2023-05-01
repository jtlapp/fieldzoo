import { Type } from "@sinclair/typebox";

import { SelectivePartial, UnvalidatedFields } from "@fieldzoo/generic-types";
import {
  MultitierValidator,
  ValidationException,
} from "@fieldzoo/multitier-validator";
import { freezeField } from "@fieldzoo/freeze-field";
import { Zeroable } from "@fieldzoo/typebox-types";
import { TimestampedColumns } from "@fieldzoo/modeling";

import { CollaborativeEntity } from "./base/collaborative-entity";
import { DisplayName, DisplayNameImpl } from "../values/display-name";
import { GlossaryID, GlossaryIDImpl } from "../values/glossary-id";
import {
  MultilineDescription,
  MultilineDescriptionImpl,
} from "../values/multiline-description";
import { UserID } from "../values/user-id";
import { NormalizedName, NormalizedNameImpl } from "../values/normalized-name";
import { TermID, TermIDImpl } from "../values/term-id";
import { VersionNumber } from "../values/version-number";

/**
 * Class representing a valid term
 */
export class Term extends CollaborativeEntity {
  #displayName: DisplayName;
  #lookupName?: NormalizedName; // generated on demand

  static schema = Type.Object({
    id: Zeroable(TermIDImpl.schema),
    version: Zeroable(super.collaborativeSchema.version),
    lookupName: Type.Optional(NormalizedNameImpl.schema),
    glossaryID: GlossaryIDImpl.schema,
    displayName: DisplayNameImpl.schema,
    description: MultilineDescriptionImpl.schema,
    modifiedBy: super.collaborativeSchema.modifiedBy,
    createdAt: super.timestampedSchema.createdAt,
    modifiedAt: super.timestampedSchema.modifiedAt,
  });
  static #validator = new MultitierValidator(this.schema);

  /**
   * @param id The unique ID of the term in the database.
   * @param version The number for this version of the term.
   * @param glossaryID The ID of the glossary this term belongs to.
   * @param displayName The term's display name.
   * @param description The term's description.
   * @param modifiedBy The ID of the user who last updated this term.
   * @param lookupName The term's name, normalized for lookup.
   *  Computed from displayName on demand when not provided.
   * @param createdAt The date/time at which the term was created.
   * @param modifiedAt The date/time at which the term was last modified.
   */
  constructor(
    readonly id: TermID,
    version: VersionNumber,
    public glossaryID: GlossaryID,
    displayName: DisplayName,
    public description: MultilineDescription,
    modifiedBy: UserID,
    lookupName?: NormalizedName,
    createdAt?: Date,
    modifiedAt?: Date
  ) {
    super(version, modifiedBy, createdAt, modifiedAt);
    freezeField(this, "id");
    freezeField(this, "glossaryID");
    this.#displayName = displayName;
    this.#lookupName = lookupName;
  }

  /**
   * Cast a new term from fields, optionally with validation.
   * @param fields The term's properties. `id` and `lookupName` are optional.
   *  `id` defaults to 0 for terms not yet in the database. `lookupName`
   *  derives from `displayName` when not provided.
   * @param validate Whether to validate the fields. Defaults to true.
   * @returns A new term.
   */
  static castFrom(
    fields: Readonly<
      SelectivePartial<
        UnvalidatedFields<Term> & {
          displayName: string;
          lookupName: string;
        },
        "id" | "lookupName" | TimestampedColumns
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
          NormalizedNameImpl.castFrom(fields.displayName as DisplayName)
      ) {
        throw new ValidationException(
          "lookupName is inconsistent with displayName"
        );
      }
    }
    return new Term(
      fields.id as TermID,
      fields.version as VersionNumber,
      fields.glossaryID as GlossaryID,
      fields.displayName as DisplayName,
      fields.description as MultilineDescription,
      fields.modifiedBy as UserID,
      fields.lookupName as NormalizedName,
      fields.createdAt as Date,
      fields.modifiedAt as Date
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
      this.#lookupName = NormalizedNameImpl.castFrom(this.#displayName);
    }
    return this.#lookupName;
  }
}
export interface Term {
  readonly __typeID: unique symbol;
}
