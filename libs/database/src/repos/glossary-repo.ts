import { Kysely } from "kysely";
import { TableMapper } from "kysely-mapper";

import { createBase64UUID } from "@fieldzoo/base64-uuid";
import { Glossary, GlossaryID } from "@fieldzoo/model";
import { TimestampedRepo } from "@fieldzoo/modeling";

import { Database } from "../tables/current-tables";

/**
 * Repository for persisting glossaries.
 */
export class GlossaryRepo extends TimestampedRepo<Database, "glossaries"> {
  readonly #table: ReturnType<GlossaryRepo["getMapper"]>;

  constructor(readonly db: Kysely<Database>) {
    super();
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
      ? this.#table.update(glossary.uuid).returnOne(glossary)
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
      insertReturnColumns: super.getInsertReturnColumns(["uuid"]),
      updateReturnColumns: super.getUpdateReturnColumns(),
    }).withTransforms({
      insertTransform: (glossary: Glossary) =>
        super.getUpsertValues(glossary, {
          uuid: createBase64UUID(),
        }),
      insertReturnTransform: (glossary: Glossary, returns) =>
        Glossary.castFrom(
          super.getInsertReturnValues(glossary, returns, {
            uuid: returns.uuid,
          }),
          false
        ),
      updateTransform: (glossary: Glossary) => super.getUpsertValues(glossary),
      updateReturnTransform: (glossary: Glossary, returns) =>
        Glossary.castFrom(
          super.getUpdateReturnValues(glossary, returns),
          false
        ),
      selectTransform: (row) => Glossary.castFrom(row, false),
      countTransform: (count) => Number(count),
    });
  }
}
