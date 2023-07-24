import { Type } from "@sinclair/typebox";
import { CompilingStandardValidator } from "typebox-validators";

import { UnvalidatedFields } from "@fieldzoo/generic-types";
import { DisplayName, MultilineDescription } from "@fieldzoo/general-model";
import {
  UserID,
  VersionEntity,
  VersionNumber,
  WhatChangedLine,
} from "@fieldzoo/system-model";

import { Term } from "./term";
import { GlossaryID } from "../values/glossary-id";
import { TermID, toTermID } from "../values/term-id";

/**
 * Class representing a valid term version
 */
export class TermVersion extends VersionEntity {
  static schema = Type.Object({
    termID: toTermID.schema,
    versionNumber: super.versionSchema.versionNumber,
    glossaryID: Term.schema.properties.glossaryID,
    displayName: Term.schema.properties.displayName,
    description: Term.schema.properties.description,
    modifiedBy: super.versionSchema.modifiedBy,
    createdAt: super.versionSchema.createdAt,
    modifiedAt: super.versionSchema.modifiedAt,
    whatChangedLine: super.versionSchema.whatChangedLine,
  });
  static #validator = new CompilingStandardValidator(this.schema);

  /**
   * @param termID The unique ID of the term in the database.
   * @param versionNumber The number for this version of the term.
   * @param glossaryID The ID of the glossary this term belongs to.
   * @param displayName The term's display name.
   * @param description The term's description.
   * @param modifiedBy The ID of the user who last updated this term.
   * @param createdAt The date/time at which the term was created.
   * @param modifiedAt The date/time at which the term was last modified.
   * @param whatChangedLine Line describing what changed in this version.
   */
  constructor(
    readonly termID: TermID,
    versionNumber: VersionNumber,
    readonly glossaryID: GlossaryID,
    readonly displayName: DisplayName,
    readonly description: MultilineDescription,
    modifiedBy: UserID,
    createdAt: Date,
    modifiedAt: Date,
    whatChangedLine: WhatChangedLine
  ) {
    super(createdAt, modifiedAt, modifiedBy, versionNumber, whatChangedLine);
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
      this.#validator.assert(fields, "Invalid term version");
    }
    return new TermVersion(
      fields.termID as TermID,
      fields.versionNumber as VersionNumber,
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
