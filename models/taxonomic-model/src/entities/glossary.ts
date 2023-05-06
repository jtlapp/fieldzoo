import { Type } from "@sinclair/typebox";

import { SelectivePartial, UnvalidatedFields } from "@fieldzoo/generic-types";
import { MultitierValidator } from "@fieldzoo/multitier-validator";
import { EmptyStringable, Nullable, Zeroable } from "@fieldzoo/typebox-types";
import { freezeField } from "@fieldzoo/freeze-field";
import { UserID, UserIDImpl } from "@fieldzoo/system-model";
import { TimestampedColumns } from "@fieldzoo/modeling";

import { DisplayName, DisplayNameImpl } from "../values/display-name";
import { GlossaryID, GlossaryIDImpl } from "../values/glossary-id";
import {
  MultilineDescription,
  MultilineDescriptionImpl,
} from "../values/multiline-description";
import { VersionNumber } from "../values/version-number";
import { CollaborativeEntity } from "./base/collaborative-entity";

/**
 * Class representing a valid glossary.
 */
export class Glossary extends CollaborativeEntity {
  static schema = Type.Object({
    uuid: EmptyStringable(GlossaryIDImpl.schema),
    versionNumber: Zeroable(super.collaborativeSchema.versionNumber),
    ownerID: UserIDImpl.schema,
    name: DisplayNameImpl.schema,
    description: Nullable(MultilineDescriptionImpl.schema),
    modifiedBy: UserIDImpl.schema,
    createdAt: super.timestampedSchema.createdAt,
    modifiedAt: super.timestampedSchema.modifiedAt,
  });
  static #validator = new MultitierValidator(this.schema);

  /**
   * @param uuid The glossary's UUID.
   * @param versionNumber The number for this version of the glossary.
   * @param ownerID The ID of the user who owns this glossary.
   * @param name The glossary's name.
   * @param description The glossary's description.
   * @param modifiedBy The ID of the user who last updated this glossary.
   * @param createdAt The date/time at which the glossary was created.
   * @param modifiedAt The date/time at which the glossary was last modified.
   */
  constructor(
    readonly uuid: GlossaryID,
    versionNumber: VersionNumber,
    public ownerID: UserID,
    public name: DisplayName,
    public description: MultilineDescription | null,
    modifiedBy: UserID,
    createdAt?: Date,
    modifiedAt?: Date
  ) {
    super(versionNumber, modifiedBy, createdAt, modifiedAt);
    freezeField(this, "uuid");
  }

  /**
   * Cast a new glossary from fields, optionally with validation.
   * @param fields The glossary's properties. `uuid` is optional, defaulting to
   *  the empty string for glossaries not yet in the database.
   * @param validate Whether to validate the fields. Defaults to true.
   * @returns A new glossary.
   */
  static castFrom(
    fields: SelectivePartial<
      UnvalidatedFields<Glossary>,
      "uuid" | TimestampedColumns
    >,
    validate = true
  ) {
    if (fields.uuid === undefined) {
      fields = { ...fields, uuid: "" };
    }
    if (validate) {
      this.#validator.safeValidate(fields, "Invalid glossary");
    }
    return new Glossary(
      fields.uuid as GlossaryID,
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
