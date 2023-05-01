import { Type } from "@sinclair/typebox";

import { UnvalidatedFields } from "@fieldzoo/generic-types";
import { MultitierValidator } from "@fieldzoo/multitier-validator";
import { Zeroable } from "@fieldzoo/typebox-types";

import { DisplayName, DisplayNameImpl } from "../values/display-name";
import { GlossaryID, GlossaryIDImpl } from "../values/glossary-id";
import {
  MultilineDescription,
  MultilineDescriptionImpl,
} from "../values/multiline-description";
import { UserID } from "../values/user-id";
import { TermID, TermIDImpl } from "../values/term-id";
import { VersionNumber } from "../values/version-number";
import {
  WhatChangedLine,
  WhatChangedLineeImpl,
} from "../values/what-changed-line";
import { VersionEntity } from "./base/version-entity";

/**
 * Class representing a valid term version
 */
export class TermVersion extends VersionEntity {
  static schema = Type.Object({
    id: Zeroable(TermIDImpl.schema),
    version: super.versionSchema.version,
    glossaryID: GlossaryIDImpl.schema,
    displayName: DisplayNameImpl.schema,
    description: MultilineDescriptionImpl.schema,
    modifiedBy: super.versionSchema.modifiedBy,
    createdAt: super.versionSchema.createdAt,
    modifiedAt: super.versionSchema.modifiedAt,
    whatChangedLine: WhatChangedLineeImpl.schema,
  });
  static #validator = new MultitierValidator(this.schema);

  /**
   * @param id The unique ID of the term in the database.
   * @param version The number for this version of the term.
   * @param glossaryID The ID of the glossary this term belongs to.
   * @param displayName The term's display name.
   * @param description The term's description.
   * @param modifiedBy The ID of the user who last updated this term.
   * @param createdAt The date/time at which the term was created.
   * @param modifiedAt The date/time at which the term was last modified.
   * @param whatChangedLine Line describing what changed in this version.
   */
  constructor(
    readonly id: TermID,
    version: VersionNumber,
    readonly glossaryID: GlossaryID,
    readonly displayName: DisplayName,
    readonly description: MultilineDescription,
    modifiedBy: UserID,
    createdAt: Date,
    modifiedAt: Date,
    readonly whatChangedLine: WhatChangedLine
  ) {
    super(createdAt, modifiedAt, modifiedBy, version);
    Object.freeze(this);
  }

  /**
   * Cast a new term version from fields, optionally with validation.
   * @param fields The term version's properties.
   * @param validate Whether to validate the fields. Defaults to true.
   * @returns A new term version.
   */
  static castFrom(
    fields: Readonly<UnvalidatedFields<TermVersion>>,
    validate = true
  ) {
    if (validate) {
      this.#validator.safeValidate(fields, "Invalid term version");
    }
    return new TermVersion(
      fields.id as TermID,
      fields.version as VersionNumber,
      fields.glossaryID as GlossaryID,
      fields.displayName as DisplayName,
      fields.description as MultilineDescription,
      fields.modifiedBy as UserID,
      fields.createdAt as Date,
      fields.modifiedAt as Date,
      fields.whatChangedLine as WhatChangedLine
    );
  }
}
export interface TermVersion {
  readonly __typeID: unique symbol;
}
