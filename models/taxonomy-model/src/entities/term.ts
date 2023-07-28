import { Type } from "@sinclair/typebox";

import { SelectivePartial, UnvalidatedFields } from "@fieldzoo/generic-types";
import {
  CompilingStandardValidator,
  ValidationException,
} from "typebox-validators";
import { freezeField } from "@fieldzoo/freeze-field";
import { Zeroable } from "@fieldzoo/typebox-types";
import {
  DisplayName,
  toDisplayName,
  MultilineDescription,
  toMultilineDescription,
  NormalizedName,
  toNormalizedName,
  TimestampedColumns,
} from "@fieldzoo/general-model";
import {
  CollaborativeEntity,
  UserID,
  VersionNumber,
} from "@fieldzoo/system-model";

import { GlossaryID, toGlossaryID } from "../values/glossary-id";
import { TermID, toTermID } from "../values/term-id";

/**
 * Class representing a valid term
 */
export class Term extends CollaborativeEntity {
  #displayName: DisplayName;
  #lookupName?: NormalizedName; // generated on demand

  static schema = Type.Object({
    ...super.collaborativeSchema.properties,
    id: Zeroable(toTermID.schema),
    versionNumber: Zeroable(super.collaborativeSchema.properties.versionNumber),
    lookupName: Type.Optional(toNormalizedName.schema),
    glossaryID: toGlossaryID.schema,
    displayName: toDisplayName.schema,
    description: toMultilineDescription.schema,
  });
  static #validator = new CompilingStandardValidator(this.schema);

  /**
   * @param id The unique ID of the term in the database.
   * @param versionNumber The number for this version of the term.
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
    versionNumber: VersionNumber,
    public glossaryID: GlossaryID,
    displayName: DisplayName,
    public description: MultilineDescription,
    modifiedBy: UserID,
    lookupName?: NormalizedName,
    createdAt?: Date,
    modifiedAt?: Date
  ) {
    super(versionNumber, modifiedBy, createdAt, modifiedAt);
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
      this.#validator.assert(fields, "Invalid term");
      if (
        fields.lookupName !== undefined &&
        fields.lookupName != toNormalizedName(fields.displayName as DisplayName)
      ) {
        throw new ValidationException(
          "lookupName is inconsistent with displayName"
        );
      }
    }
    return new Term(
      fields.id as TermID,
      fields.versionNumber as VersionNumber,
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
      this.#lookupName = toNormalizedName(this.#displayName);
    }
    return this.#lookupName;
  }
}
