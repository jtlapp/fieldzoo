import { Kysely } from "kysely";

import { Glossary, GlossaryID, UserID } from "@fieldzoo/model";
import { OrmTableFacet } from "@fieldzoo/kysely-facets";

import { Database } from "../tables/current-tables";
import { randomUUID } from "crypto";

/**
 * Repository for persisting glossaries.
 */
export class GlossaryRepo {
  readonly #tableFacet: OrmTableFacet<Database, "glossaries", "uuid", Glossary>;
  constructor(readonly db: Kysely<Database>) {
    this.#tableFacet = new OrmTableFacet(db, "glossaries", "uuid", {
      insertTransform: (glossary) => ({
        ...glossary,
        uuid: randomUUID(),
      }),
      insertReturnTransform: (glossary, returns) => {
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
    });
  }

  /**
   * Delete a glossary by ID.
   * @param id ID of the glossary to delete.
   * @returns true if the glossary was deleted, false if the glossary
   *  was not found.
   */
  async deleteById(id: GlossaryID): Promise<boolean> {
    return this.#tableFacet.deleteById(id);
  }

  /**
   * Get a glossary by ID.
   * @param id ID of the glossary to get.
   * @returns the glossary, or null if the glossary was not found.
   */
  async getByID(id: GlossaryID): Promise<Glossary | null> {
    return this.#tableFacet.selectById(id);
  }

  /**
   * Insert or update a glossary. Glossaries with empty string UUIDs are
   * inserted; glossaries with non-empty UUIDs are updated.
   * @param glossary Glossary to insert or update.
   * @returns the glossary, or null if the glossary-to-update was not found.
   */
  async store(glossary: Glossary): Promise<Glossary | null> {
    return this.#tableFacet.upsert(glossary);
  }
}
