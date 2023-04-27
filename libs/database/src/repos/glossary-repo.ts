import { Kysely } from "kysely";

import { createBase64UUID } from "@fieldzoo/base64-uuid";
import { Glossary } from "@fieldzoo/model";
import { TableMapper } from "kysely-mapper";

import { Database } from "../tables/current-tables";
import { GlossaryID } from "@fieldzoo/model";

/**
 * Repository for persisting glossaries.
 */
export class GlossaryRepo {
  readonly #table: ReturnType<GlossaryRepo["getMapper"]>;

  constructor(readonly db: Kysely<Database>) {
    this.#table = this.getMapper(db);
  }

  /**
   * Delete a glossary by ID.
   * @param uuid UUID of the glossary to delete.
   * @returns true if the glossary was deleted, false if the glossary
   *  was not found.
   */
  async deleteByID(uuid: GlossaryID): Promise<boolean> {
    return this.#table.delete(uuid).run();
  }

  /**
   * Get a glossary by ID.
   * @param uuid UUID of the glossary to get.
   * @returns the glossary, or null if the glossary was not found.
   */
  async getByID(uuid: GlossaryID): Promise<Glossary | null> {
    return this.#table.select(uuid).returnOne();
  }

  /**
   * Insert or update a glossary. Glossaries with empty string UUIDs are
   * inserted; glossaries with non-empty UUIDs are updated.
   * @param glossary Glossary to insert or update.
   * @returns the glossary, or null if the glossary-to-update was not found.
   */
  async store(glossary: Glossary): Promise<Glossary | null> {
    return glossary.uuid
      ? (await this.#table.update(glossary.uuid).run(glossary))
        ? glossary
        : null
      : this.#table.insert().returnOne(glossary);
  }

  /**
   * Get a mapper for the glossaries table. This is a method so that the
   * mapper type can be inferred from its options without having to
   * specify the type parameters.
   */
  private getMapper(db: Kysely<Database>) {
    return new TableMapper(db, "glossaries", {
      keyColumns: ["uuid"],
    }).withTransforms({
      insertTransform: (glossary: Glossary) => ({
        ...glossary,
        uuid: createBase64UUID(),
      }),
      // TODO: find way to avoid 'any' here and elsewhere
      insertReturnTransform: (glossary: Glossary, returns) =>
        Glossary.create({ ...glossary, uuid: returns.uuid }, false),
      selectTransform: (row) => Glossary.create(row, false),
      updateTransform: (glossary: Glossary) => glossary,
    });
  }
}
