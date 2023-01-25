import { Matches, MaxLength, MinLength, IsOptional } from "class-validator";

import {
  assertValid,
  FieldsOf,
  MULTI_LINE_UNICODE_REGEX,
  SINGLE_LINE_UNICODE_REGEX,
} from "@fieldzoo/utilities";

import { UserID } from "./user";

/** Min. length of glossary name (chars) */
export const MIN_GLOSSARY_NAME_LENGTH = 1;
/** Max. length of glossary name (chars) */
export const MAX_GLOSSARY_NAME_LENGTH = 100;
/** Max. length of glossary description (chars) */
export const MAX_GLOSSARY_DESCRIPTION_LENGTH = 1000;

/** Database ID of a glossary record */
export type GlossaryID = string & { readonly __typeID: unique symbol };

/**
 * Class representing a valid glossary
 */
export class Glossary {
  readonly id: GlossaryID;
  readonly ownerID: UserID;

  @Matches(SINGLE_LINE_UNICODE_REGEX)
  @MinLength(MIN_GLOSSARY_NAME_LENGTH)
  @MaxLength(MAX_GLOSSARY_NAME_LENGTH) // checked first
  readonly name: string;

  @Matches(MULTI_LINE_UNICODE_REGEX)
  @MaxLength(MAX_GLOSSARY_DESCRIPTION_LENGTH)
  @IsOptional()
  readonly description: string | null;

  constructor(fields: FieldsOf<Glossary>, assumeValid = false) {
    this.id = fields.id;
    this.ownerID = fields.ownerID;
    this.name = fields.name;
    this.description = fields.description;

    if (!assumeValid) assertValid(this, "Invalid glossary");
    Object.freeze(this);
  }
}
export interface Glossary {
  readonly __typeID: unique symbol;
}
