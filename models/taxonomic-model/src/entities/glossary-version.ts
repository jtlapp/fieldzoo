import { Type } from "@sinclair/typebox";
import { CompilingStandardValidator } from "typebox-validators";

import { UnvalidatedFields } from "@fieldzoo/generic-types";
import { UserID } from "@fieldzoo/system-model";

import { DisplayName } from "../values/display-name";
import { GlossaryID, GlossaryIDImpl } from "../values/glossary-id";
import { MultilineDescription } from "../values/multiline-description";
import { VersionEntity } from "./base/version-entity";
import { Glossary } from "./glossary";
import { WhatChangedLine } from "../values/what-changed-line";
import { VersionNumber } from "../values/version-number";
import { Visibility } from "../values/visibility";

/**
 * Class representing a valid glossary.
 */
export class GlossaryVersion extends VersionEntity {
  static schema = Type.Object({
    glossaryID: GlossaryIDImpl.schema,
    versionNumber: super.versionSchema.versionNumber,
    ownerID: Glossary.schema.properties.ownerID,
    name: Glossary.schema.properties.name,
    description: Glossary.schema.properties.description,
    visibility: Glossary.schema.properties.visibility,
    modifiedBy: super.versionSchema.modifiedBy,
    createdAt: super.versionSchema.createdAt,
    modifiedAt: super.versionSchema.modifiedAt,
    whatChangedLine: super.versionSchema.whatChangedLine,
  });
  static #validator = new CompilingStandardValidator(this.schema);

  /**
   * @param glossaryID The glossary's UUID.
   * @param versionNumber The number for this version of the glossary.
   * @param ownerID The ID of the user who owns this glossary.
   * @param name The glossary's name.
   * @param description The glossary's description.
   * @param visibility The glossary's visibility.
   * @param modifiedBy The ID of the user who last updated this glossary.
   * @param createdAt The date/time at which the glossary was created.
   * @param modifiedAt The date/time at which the glossary was last modified.
   * @param whatChangedLine Line describing what changed in this version.
   */
  constructor(
    readonly glossaryID: GlossaryID,
    versionNumber: VersionNumber,
    public ownerID: UserID,
    public name: DisplayName,
    public description: MultilineDescription | null,
    public visibility: Visibility,
    modifiedBy: UserID,
    createdAt: Date,
    modifiedAt: Date,
    whatChangedLine: WhatChangedLine
  ) {
    super(createdAt, modifiedAt, modifiedBy, versionNumber, whatChangedLine);
    Object.freeze(this);
  }

  /**
   * Cast a new glossary version from fields, optionally with validation.
   * @param fields The glossary version's properties.
   * @param validate Whether to validate the fields. Defaults to true.
   * @returns A new glossary version.
   */
  static castFrom(fields: UnvalidatedFields<GlossaryVersion>, validate = true) {
    if (validate) {
      this.#validator.assert(fields, "Invalid glossary version");
    }
    return new GlossaryVersion(
      fields.glossaryID as GlossaryID,
      fields.versionNumber as VersionNumber,
      fields.ownerID as UserID,
      fields.name as DisplayName,
      fields.description as MultilineDescription | null,
      fields.visibility as Visibility,
      fields.modifiedBy as UserID,
      fields.createdAt as Date,
      fields.modifiedAt as Date,
      fields.whatChangedLine as WhatChangedLine
    );
  }
}
export interface GlossaryVersion {
  readonly __validated__: unique symbol;
}
