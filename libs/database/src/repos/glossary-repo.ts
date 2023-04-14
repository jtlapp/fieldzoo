import { Kysely } from "kysely";

import { Glossary, GlossaryID, UserID } from "@fieldzoo/model";
import { UniformTableMapper } from "kysely-mapper";

import { Database } from "../tables/current-tables";
import { createBase64UUID } from "../lib/base64-uuid";

/**
 * Repository for persisting glossaries.
 */
export class GlossaryRepo {
  readonly #mapper: ReturnType<GlossaryRepo["getMapper"]>;

  constructor(readonly db: Kysely<Database>) {
    this.#mapper = this.getMapper(db);
  }

  /**
   * Delete a glossary by ID.
   * @param uuid UUID of the glossary to delete.
   * @returns true if the glossary was deleted, false if the glossary
   *  was not found.
   */
  async deleteById(uuid: GlossaryID): Promise<boolean> {
    return this.#mapper.delete({ uuid }).run();
  }

  /**
   * Get a glossary by ID.
   * @param uuid UUID of the glossary to get.
   * @returns the glossary, or null if the glossary was not found.
   */
  async getByID(uuid: GlossaryID): Promise<Glossary | null> {
    return this.#mapper.select({ uuid }).getOne();
  }

  /**
   * Insert or update a glossary. Glossaries with empty string UUIDs are
   * inserted; glossaries with non-empty UUIDs are updated.
   * @param glossary Glossary to insert or update.
   * @returns the glossary, or null if the glossary-to-update was not found.
   */
  async store(glossary: Glossary): Promise<Glossary | null> {
    return glossary.uuid
      ? this.#mapper.update({ uuid: glossary.uuid }).getOne(glossary)
      : this.#mapper.insert().getOne(glossary);
  }

  /**
   * Get a mapper for the glossaries table. This is a method so that the
   * mapper type can be inferred from its options without having to
   * specify the type parameters.
   */
  private getMapper(db: Kysely<Database>) {
    return new UniformTableMapper(db, "glossaries", {
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
}
