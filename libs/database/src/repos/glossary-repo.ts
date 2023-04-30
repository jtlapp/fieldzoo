import { Kysely } from "kysely";
import { TableMapper } from "kysely-mapper";

import { createBase64UUID } from "@fieldzoo/base64-uuid";
import { Glossary, GlossaryID } from "@fieldzoo/model";
import { TimestampedTable } from "@fieldzoo/modeling";

import { Database, Glossaries } from "../tables/current-tables";

/**
 * Repository for persisting glossaries.
 */
export class GlossaryRepo {
  readonly #table: ReturnType<GlossaryRepo["getMapper"]>;

  constructor(readonly db: Kysely<Database>) {
    this.#table = this.getMapper(db);
  }

  /**
   * Adds a glossary to the repository.
   * @param glossary Glossary to add.
   * @returns A new glossary instance with its assigned UUID.
   */
  async add(glossary: Glossary): Promise<Glossary> {
    return this.#table.insert().returnOne(glossary);
  }

  /**
   * Deletes a glossary by ID.
   * @param uuid UUID of the glossary to delete.
   * @returns true if the glossary was deleted, false if the glossary
   *  was not found.
   */
  async deleteByID(uuid: GlossaryID): Promise<boolean> {
    return this.#table.delete(uuid).run();
  }

  /**
   * Gets a glossary by ID.
   * @param uuid UUID of the glossary to get.
   * @returns the glossary, or null if the glossary was not found.
   */
  async getByID(uuid: GlossaryID): Promise<Glossary | null> {
    return this.#table.select(uuid).returnOne();
  }

  /**
   * Updates a glossary, including changing its `modifiedAt` date.
   * @param glossary Glosario with modified values.
   * @returns Whether the glossary was found and updated.
   */
  async update(glossary: Glossary): Promise<boolean> {
    return (
      (await this.#table.update(glossary.uuid).returnOne(glossary)) !== null
    );
  }

  /**
   * Gets a mapper for the glossaries table. This is a method so that the
   * mapper type can be inferred from its options without having to
   * specify the type parameters.
   */
  private getMapper(db: Kysely<Database>) {
    return new TableMapper(db, "glossaries", {
      keyColumns: ["uuid"],
      insertReturnColumns: TimestampedTable.getInsertReturnColumns<Glossaries>([
        "uuid",
      ]),
      updateReturnColumns:
        TimestampedTable.getUpdateReturnColumns<Glossaries>(),
    }).withTransforms({
      insertTransform: (glossary: Glossary) =>
        TimestampedTable.getUpsertValues(glossary, {
          uuid: createBase64UUID(),
        }),
      insertReturnTransform: (glossary: Glossary, returns) =>
        Glossary.castFrom(
          { ...glossary, ...returns, uuid: returns.uuid },
          false
        ),
      updateTransform: (glossary: Glossary) =>
        TimestampedTable.getUpsertValues(glossary),
      updateReturnTransform: (glossary: Glossary, returns) =>
        Object.assign(glossary, returns) as Glossary,
      selectTransform: (row) => Glossary.castFrom(row, false),
      countTransform: (count) => Number(count),
    });
  }
}
