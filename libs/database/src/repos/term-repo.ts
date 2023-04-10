import { Kysely } from "kysely";

import { GlossaryID, TermID, Term, UserID } from "@fieldzoo/model";
import { ObjectTableLens } from "kysely-mapper";

import { Database } from "../tables/current-tables";
import { createBase64UUID } from "../lib/base64-uuid";

/**
 * Repository for persisting terms.
 */
export class TermRepo {
  readonly #tableLens: ObjectTableLens<Database, "terms", Term, ["uuid"]>;

  constructor(readonly db: Kysely<Database>) {
    this.#tableLens = new ObjectTableLens(db, "terms", ["uuid"], {
      insertTransform: (term) => ({
        ...term,
        uuid: createBase64UUID(),
      }),
      updaterTransform: (term) => term,
      insertReturnTransform: (term: Term, returns: any) => {
        return new Term({ ...term, uuid: returns.uuid as TermID }, true);
      },
      selectTransform: (row) =>
        new Term(
          {
            ...row,
            uuid: row.uuid as TermID,
            glossaryId: row.glossaryId as GlossaryID,
            updatedBy: row.updatedBy as UserID,
          },
          true
        ),
    });
  }

  /**
   * Delete a term by ID.
   * @param id ID of the term to delete.
   * @returns true if the term was deleted, false if the term
   *  was not found.
   */
  async deleteById(id: TermID): Promise<boolean> {
    return this.#tableLens.deleteByKey(id);
  }

  /**
   * Get a term by ID.
   * @param id ID of the term to get.
   * @returns the term, or null if the term was not found.
   */
  async getByID(id: TermID): Promise<Term | null> {
    return this.#tableLens.selectByKey(id);
  }

  /**
   * Insert or update a term. Terms with empty string UUIDs are
   * inserted; terms with non-empty UUIDs are updated.
   * @param term Term to insert or update.
   * @returns the glossary, or null if the glossary-to-update was not found.
   */
  async store(term: Term): Promise<Term | null> {
    return term.uuid
      ? this.#tableLens.update(term)
      : this.#tableLens.insert(term);
  }
}
