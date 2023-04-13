import { Kysely } from "kysely";

import { Glossary, GlossaryID, UserID } from "@fieldzoo/model";
import { UniformTableMapper } from "kysely-mapper";

import { Database } from "../tables/current-tables";
import { createBase64UUID } from "../lib/base64-uuid";

/**
 * Repository for persisting glossaries.
 */
export class GlossaryRepo {
  readonly #table: UniformTableMapper<
    Database,
    "glossaries",
    Glossary,
    ["uuid"],
    ["*"],
    ["uuid"],
    number
  >;

  constructor(readonly db: Kysely<Database>) {
    this.#table = new UniformTableMapper(db, "glossaries", {
      isMappedObject: (obj) => obj instanceof Glossary,
      primaryKeyColumns: ["uuid"],
      insertTransform: (glossary) => ({
        ...glossary,
        uuid: createBase64UUID(),
      }),
      insertReturnTransform: (glossary: Glossary, returns: any) => {
        return new Glossary(
          { ...glossary, uuid: returns.uuid as GlossaryID },
          true
        );
      },
      selectTransform: (row) =>
        new Glossary(
          {
            ...row,
            uuid: row.uuid as GlossaryID,
            ownerId: row.ownerId as UserID,
            updatedBy: row.updatedBy as UserID,
          },
          true
        ),
      updateTransform: (glossary) => glossary,
    });
  }

  /**
   * Delete a glossary by ID.
   * @param uuid UUID of the glossary to delete.
   * @returns true if the glossary was deleted, false if the glossary
   *  was not found.
   */
  async deleteById(uuid: GlossaryID): Promise<boolean> {
    return this.#table.delete({ uuid }).run();
  }

  /**
   * Get a glossary by ID.
   * @param uuid UUID of the glossary to get.
   * @returns the glossary, or null if the glossary was not found.
   */
  async getByID(uuid: GlossaryID): Promise<Glossary | null> {
    return this.#table.select({ uuid }).getOne();
  }

  /**
   * Insert or update a glossary. Glossaries with empty string UUIDs are
   * inserted; glossaries with non-empty UUIDs are updated.
   * @param glossary Glossary to insert or update.
   * @returns the glossary, or null if the glossary-to-update was not found.
   */
  async store(glossary: Glossary): Promise<Glossary | null> {
    return glossary.uuid
      ? this.#table.update({ uuid: glossary.uuid }).getOne(glossary)
      : this.#table.insert().getOne(glossary);
  }
}
