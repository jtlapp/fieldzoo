import { Kysely } from "kysely";
import { TableMapper } from "kysely-mapper";

import { createBase64UUID } from "@fieldzoo/base64-uuid";
import { Database, Glossaries, CollaborativeTable } from "@fieldzoo/database";

import { Glossary } from "../entities/glossary";
import { GlossaryID } from "../values/glossary-id";

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
   * @param id UUID of the glossary to delete.
   * @returns true if the glossary was deleted, false if the glossary
   *  was not found.
   */
  async deleteByID(id: GlossaryID): Promise<boolean> {
    return this.#table.delete(id).run();
  }

  /**
   * Gets a glossary by ID.
   * @param id UUID of the glossary to get.
   * @returns the glossary, or null if the glossary was not found.
   */
  async getByID(id: GlossaryID): Promise<Glossary | null> {
    return this.#table.select(id).returnOne();
  }

  /**
   * Updates a glossary, including changing its `modifiedAt` date.
   * @param glossary Glosario with modified values.
   * @returns Whether the glossary was found and updated.
   */
  async update(glossary: Glossary): Promise<boolean> {
    return (await this.#table.update(glossary.id).returnOne(glossary)) !== null;
  }

  /**
   * Gets a mapper for the glossaries table. This is a method so that the
   * mapper type can be inferred from its options without having to
   * specify the type parameters.
   */
  private getMapper(db: Kysely<Database>) {
    return new TableMapper(db, "glossaries", {
      keyColumns: ["id"],
      insertReturnColumns:
        CollaborativeTable.addInsertReturnColumns<Glossaries>(["id"]),
      updateReturnColumns:
        CollaborativeTable.addUpdateReturnColumns<Glossaries>(),
    }).withTransforms({
      insertTransform: (glossary: Glossary) =>
        CollaborativeTable.removeGeneratedValues({
          ...glossary,
          id: createBase64UUID(),
        }),
      insertReturnTransform: (glossary: Glossary, returns) =>
        Glossary.castFrom({ ...glossary, ...returns }, false),
      updateTransform: (glossary: Glossary) =>
        CollaborativeTable.removeGeneratedValues(glossary),
      updateReturnTransform: (glossary: Glossary, returns) =>
        Object.assign(glossary, returns) as Glossary,
      selectTransform: (row) => Glossary.castFrom(row, false),
      countTransform: (count) => Number(count),
    });
  }
}
