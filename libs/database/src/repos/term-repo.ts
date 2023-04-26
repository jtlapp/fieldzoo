import { Kysely } from "kysely";

import { Term } from "@fieldzoo/model";
import { TableMapper } from "kysely-mapper";

import { Database } from "../tables/current-tables";
import { createBase64UUID } from "../lib/base64-uuid";
import { TermID } from "@fieldzoo/model";

/**
 * Repository for persisting terms.
 */
export class TermRepo {
  readonly #table: ReturnType<TermRepo["getMapper"]>;

  constructor(readonly db: Kysely<Database>) {
    this.#table = this.getMapper(db);
  }

  /**
   * Delete a term by ID.
   * @param uuid UUID of the term to delete.
   * @returns true if the term was deleted, false if the term
   *  was not found.
   */
  async deleteById(uuid: TermID): Promise<boolean> {
    return this.#table.delete(uuid).run();
  }

  /**
   * Get a term by UUID.
   * @param uuid UUID of the term to get.
   * @returns the term, or null if the term was not found.
   */
  async getByID(uuid: TermID): Promise<Term | null> {
    return this.#table.select(uuid).returnOne();
  }

  /**
   * Insert or update a term. Terms with empty string UUIDs are
   * inserted; terms with non-empty UUIDs are updated.
   * @param term Term to insert or update.
   * @returns the glossary, or null if the glossary-to-update was not found.
   */
  async store(term: Term): Promise<Term | null> {
    return term.uuid
      ? (await this.#table.update(term.uuid).run(term))
        ? term
        : null
      : this.#table.insert().returnOne(term);
  }

  /**
   * Get a mapper for the terms table. This is a method so that the
   * mapper type can be inferred from its options without having to
   * specify the type parameters.
   */
  private getMapper(db: Kysely<Database>) {
    return new TableMapper(db, "terms", {
      keyColumns: ["uuid"],
    }).withTransforms({
      insertTransform: (term: Term) => ({
        ...term,
        uuid: createBase64UUID(),
      }),
      insertReturnTransform: (term: Term, returns) =>
        Term.create({ ...term, uuid: returns.uuid as TermID }, true),
      selectTransform: (row) =>
        Term.create(
          {
            ...row,
            uuid: row.uuid as TermID,
            glossaryId: row.glossaryId,
            updatedBy: row.updatedBy,
          },
          true
        ),
      updateTransform: (term) => term,
    });
  }
}
