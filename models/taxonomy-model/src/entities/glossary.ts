import { Type } from "@sinclair/typebox";

import { SelectivePartial, UnvalidatedFields } from "@fieldzoo/generic-types";
import { CompilingStandardValidator } from "typebox-validators";
import { EmptyStringable, Nullable, Zeroable } from "@fieldzoo/typebox-types";
import { freezeField } from "@fieldzoo/freeze-field";
import {
  TimestampedColumns,
  DisplayName,
  toDisplayName,
  MultilineDescription,
  toMultilineDescription,
} from "@fieldzoo/general-model";
import {
  CollaborativeEntity,
  UserID,
  toUserID,
  VersionNumber,
} from "@fieldzoo/system-model";

import { GlossaryID, toGlossaryID } from "../values/glossary-id";

/**
 * Class representing a valid glossary.
 */
export class Glossary extends CollaborativeEntity {
  static schema = Type.Object({
    id: EmptyStringable(toGlossaryID.schema),
    versionNumber: Zeroable(super.collaborativeSchema.versionNumber),
    ownerID: toUserID.schema,
    name: toDisplayName.schema,
    description: Nullable(toMultilineDescription.schema),
    modifiedBy: toUserID.schema,
    createdAt: super.timestampedSchema.createdAt,
    modifiedAt: super.timestampedSchema.modifiedAt,
  });
  static #validator = new CompilingStandardValidator(this.schema);

  /**
   * @param id The glossary's UUID.
   * @param versionNumber The number for this version of the glossary.
   * @param ownerID The ID of the user who owns this glossary.
   * @param name The glossary's name.
   * @param description The glossary's description.
   * @param modifiedBy The ID of the user who last updated this glossary.
   * @param createdAt The date/time at which the glossary was created.
   * @param modifiedAt The date/time at which the glossary was last modified.
   */
  constructor(
    readonly id: GlossaryID,
    versionNumber: VersionNumber,
    public ownerID: UserID,
    public name: DisplayName,
    public description: MultilineDescription | null,
    modifiedBy: UserID,
    createdAt?: Date,
    modifiedAt?: Date
  ) {
    super(versionNumber, modifiedBy, createdAt, modifiedAt);
    freezeField(this, "id");
  }

  /**
   * Cast a new glossary from fields, optionally with validation.
   * @param fields The glossary's properties. `id` is optional, defaulting to
   *  the empty string for glossaries not yet in the database.
   * @param validate Whether to validate the fields. Defaults to true.
   * @returns A new glossary.
   */
  static castFrom(
    fields: SelectivePartial<
      UnvalidatedFields<Glossary>,
      "id" | TimestampedColumns
    >,
    validate = true
  ) {
    if (fields.id === undefined) {
      fields = { ...fields, id: "" };
    }
    if (validate) {
      this.#validator.assert(fields, "Invalid glossary");
    }
    return new Glossary(
      fields.id as GlossaryID,
      fields.versionNumber as VersionNumber,
      fields.ownerID as UserID,
      fields.name as DisplayName,
      fields.description as MultilineDescription | null,
      fields.modifiedBy as UserID,
      fields.createdAt as Date,
      fields.modifiedAt as Date
    );
  }
}
export interface Glossary {
  readonly __validated__: unique symbol;
}
