import { Kysely } from "kysely";

import { GlossaryID, TermID, Term, UserID } from "@fieldzoo/model";
import { UniformTableMapper } from "kysely-mapper";

import { Database } from "../tables/current-tables";
import { createBase64UUID } from "../lib/base64-uuid";

/**
 * Repository for persisting terms.
 */
export class TermRepo {
  readonly #mapper: ReturnType<TermRepo["getMapper"]>;

  constructor(readonly db: Kysely<Database>) {
    this.#mapper = this.getMapper(db);
  }

  /**
   * Delete a term by ID.
   * @param uuid UUID of the term to delete.
   * @returns true if the term was deleted, false if the term
   *  was not found.
   */
  async deleteById(uuid: TermID): Promise<boolean> {
    return this.#mapper.delete({ uuid }).run();
  }

  /**
   * Get a term by UUID.
   * @param uuid UUID of the term to get.
   * @returns the term, or null if the term was not found.
   */
  async getByID(uuid: TermID): Promise<Term | null> {
    return this.#mapper.select({ uuid }).getOne();
  }

  /**
   * Insert or update a term. Terms with empty string UUIDs are
   * inserted; terms with non-empty UUIDs are updated.
   * @param term Term to insert or update.
   * @returns the glossary, or null if the glossary-to-update was not found.
   */
  async store(term: Term): Promise<Term | null> {
    return term.uuid
      ? this.#mapper.update({ uuid: term.uuid }).getOne(term)
      : this.#mapper.insert().getOne(term);
  }

  /**
   * Get a mapper for the terms table. This is a method so that the
   * mapper type can be inferred from its options without having to
   * specify the type parameters.
   */
  protected getMapper(db: Kysely<Database>) {
    return new UniformTableMapper(db, "terms", {
      isMappedObject: (obj) => obj instanceof Term,
      primaryKeyColumns: ["uuid"],
      insertTransform: (term) => ({
        ...term,
        uuid: createBase64UUID(),
      }),
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
      updateTransform: (term) => term,
    });
  }
}
