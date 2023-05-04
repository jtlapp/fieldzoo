import { Type } from "@sinclair/typebox";

import { UnvalidatedFields } from "@fieldzoo/generic-types";
import { MultitierValidator } from "@fieldzoo/multitier-validator";

import { DisplayName } from "../values/display-name";
import { GlossaryID, GlossaryIDImpl } from "../values/glossary-id";
import { MultilineDescription } from "../values/multiline-description";
import { UserID } from "../values/user-id";
import { VersionEntity } from "./base/version-entity";
import { Glossary } from "./glossary";
import { WhatChangedLine } from "../values/what-changed-line";
import { VersionNumber } from "../values/version-number";

/**
 * Class representing a valid glossary.
 */
export class GlossaryVersion extends VersionEntity {
  static schema = Type.Object({
    uuid: GlossaryIDImpl.schema,
    versionNumber: super.versionSchema.versionNumber,
    ownerID: Glossary.schema.properties.ownerID,
    name: Glossary.schema.properties.name,
    description: Glossary.schema.properties.description,
    modifiedBy: super.versionSchema.modifiedBy,
    createdAt: super.versionSchema.createdAt,
    modifiedAt: super.versionSchema.modifiedAt,
    whatChangedLine: super.versionSchema.whatChangedLine,
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
   * @param whatChangedLine Line describing what changed in this version.
   */
  constructor(
    readonly uuid: GlossaryID,
    versionNumber: VersionNumber,
    public ownerID: UserID,
    public name: DisplayName,
    public description: MultilineDescription | null,
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
      this.#validator.safeValidate(fields, "Invalid glossary version");
    }
    return new GlossaryVersion(
      fields.uuid as GlossaryID,
      fields.versionNumber as VersionNumber,
      fields.ownerID as UserID,
      fields.name as DisplayName,
      fields.description as MultilineDescription | null,
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
