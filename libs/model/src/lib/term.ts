import { Matches, MaxLength, MinLength } from "class-validator";

import {
  assertValid,
  FieldsOf,
  MULTI_LINE_UNICODE_REGEX,
  SINGLE_LINE_UNICODE_REGEX,
} from "@fieldzoo/utilities";

import { UserID } from "./user";

/** Min. length of term name (chars) */
export const MIN_TERM_NAME_LENGTH = 1;
/** Max. length of term name (chars) */
export const MAX_TERM_NAME_LENGTH = 100;
/** Min. length of term description (chars) */
export const MIN_TERM_DESCRIPTION_LENGTH = 1;
/** Max. length of term description (chars) */
export const MAX_TERM_DESCRIPTION_LENGTH = 1000;

/** Database ID of a term record */
export type TermID = string & { readonly __typeID: unique symbol };

/**
 * Class representing a valid term
 */
export class Term {
  readonly id: TermID;
  readonly ownerID: UserID;

  @Matches(SINGLE_LINE_UNICODE_REGEX)
  @MinLength(MIN_TERM_NAME_LENGTH)
  @MaxLength(MAX_TERM_NAME_LENGTH) // checked first
  readonly name: string;

  @Matches(MULTI_LINE_UNICODE_REGEX)
  @MinLength(MIN_TERM_DESCRIPTION_LENGTH)
  @MaxLength(MAX_TERM_DESCRIPTION_LENGTH)
  readonly description: string;

  constructor(fields: FieldsOf<Term>, assumeValid = false) {
    this.id = fields.id;
    this.ownerID = fields.ownerID;
    this.name = fields.name;
    this.description = fields.description;

    if (!assumeValid) assertValid(this, "Invalid term");
    Object.freeze(this);
  }
}
export interface Term {
  readonly __typeID: unique symbol;
}
