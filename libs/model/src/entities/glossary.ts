import { Type } from "@sinclair/typebox";

import { SelectivePartial, UnvalidatedFields } from "@fieldzoo/generic-types";
import { MultitierValidator } from "@fieldzoo/multitier-validator";
import { EmptyStringable, Nullable } from "@fieldzoo/typebox-types";
import { freezeField } from "@fieldzoo/freeze-field";

import { DisplayName, DisplayNameImpl } from "../values/display-name";
import { GlossaryID, GlossaryIDImpl } from "../values/glossary-id";
import {
  MultilineDescription,
  MultilineDescriptionImpl,
} from "../values/multiline-description";
import { UserID, UserIDImpl } from "../values/user-id";

/**
 * Class representing a valid glossary.
 */
export class Glossary {
  static schema = Type.Object({
    uuid: EmptyStringable(GlossaryIDImpl.schema),
    ownerId: UserIDImpl.schema,
    name: DisplayNameImpl.schema,
    description: Nullable(MultilineDescriptionImpl.schema),
    updatedBy: UserIDImpl.schema,
  });
  static #validator = new MultitierValidator(this.schema);

  /**
   * @param uuid The glossary's UUID.
   * @param ownerId The ID of the user who owns this glossary.
   * @param name The glossary's name.
   * @param description The glossary's description.
   * @param updatedBy The ID of the user who last updated this glossary.
   */
  constructor(
    readonly uuid: GlossaryID,
    public ownerId: UserID,
    public name: DisplayName,
    public description: MultilineDescription | null,
    public updatedBy: UserID
  ) {
    freezeField(this, "uuid");
  }

  /**
   * Create a new glossary, optionally with validation.
   * @param fields The glossary's properties. `uuid` is optional, defaulting to
   *  the empty string for glossaries not yet in the database.
   * @param assumeValid Whether to skip validation.
   * @returns A new term.
   */
  static create(
    fields: SelectivePartial<UnvalidatedFields<Glossary>, "uuid">,
    assumeValid = false
  ) {
    if (fields.uuid === undefined) {
      fields = { ...fields, uuid: "" };
    }
    if (!assumeValid) {
      this.#validator.safeValidate(fields, "Invalid glossary");
    }
    return new Glossary(
      fields.uuid as GlossaryID,
      fields.ownerId as UserID,
      fields.name as DisplayName,
      fields.description as MultilineDescription | null,
      fields.updatedBy as UserID
    );
  }
}
export interface Glossary {
  readonly __validated__: unique symbol;
}
