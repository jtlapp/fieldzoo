import { UnvalidatedFields } from "@fieldzoo/generic-types";

import { TermID } from "../values/term-id";
import { Term } from "./term";
import { TimestampedVersion } from "../lib/timestamped-version";
import { VersionNumber } from "../values/version-number";
import { GlossaryID } from "../values/glossary-id";

/**
 * Class representing a version of a term
 */
export class TermVersion extends TimestampedVersion {
  readonly id: TermID;
  /** glossaryId need not reference an existing glossary */
  readonly glossaryId: GlossaryID;
  readonly displayName: string;
  readonly description: string;
  readonly modifiedBy: number;
  /**
   * @param id The ID of the term for which this is a version.
   * @param version Version number of the term of this ID.
   * @param displayName The term's display name.
   * @param description The term's description.
   * @param createdAt The date/time at which the term was created.
   * @param modifiedAt The date/time at which the term was last modified.
   * @param modifiedBy The ID of the user who last updated this term.
   */
  constructor(fields: Readonly<UnvalidatedFields<Term>>) {
    super(fields.createdAt, fields.modifiedAt, fields.version as VersionNumber);
    this.id = fields.id as TermID;
    this.glossaryId = fields.glossaryId as GlossaryID;
    this.displayName = fields.displayName as string;
    this.description = fields.description as string;
    this.modifiedBy = fields.modifiedBy as number;
    Object.freeze(this);
  }
}
export interface TermVersion {
  readonly __typeID: unique symbol;
}
