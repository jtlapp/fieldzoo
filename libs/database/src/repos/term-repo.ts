import { Kysely } from "kysely";

import { Term, TermID } from "@fieldzoo/model";
import { TableMapper } from "kysely-mapper";

import { Database } from "../tables/current-tables";
import { GlossaryID } from "@fieldzoo/model";
import { NormalizedName } from "@fieldzoo/model";

/**
 * Repository for persisting terms. Terms have a database-internal ID and a
 * universal key given by the tuple [glossary ID, lookup name].
 */
export class TermRepo {
  readonly #idTable: ReturnType<TermRepo["getIDMapper"]>;
  readonly #keyTable: ReturnType<TermRepo["getKeyMapper"]>;

  constructor(readonly db: Kysely<Database>) {
    this.#idTable = this.getIDMapper(db);
    this.#keyTable = this.getKeyMapper(db);
  }

  /**
   * Add a term to the repository.
   * @param term Term to add.
   * @returns The added term, with its ID updated.
   */
  async add(term: Term): Promise<Term> {
    return this.#idTable.insert().returnOne(term);
  }

  /**
   * Delete a term by ID.
   * @param id ID of the term to delete.
   * @returns true if the term was deleted, false if the term
   *  was not found.
   */
  async deleteByID(id: TermID): Promise<boolean> {
    return this.#idTable.delete(id).run();
  }

  /**
   * Get a term by key.
   * @param key Key of the term to get.
   * @returns the term, or null if the term was not found.
   */
  async getByKey(key: [GlossaryID, NormalizedName]): Promise<Term | null> {
    return this.#keyTable.select(key).returnOne();
  }

  /**
   * Updates a term.
   * @param term Term that overwrites the old term.
   * @returns Whether the term was found and updated.
   */
  async update(term: Term): Promise<boolean> {
    return this.#idTable.update(term.id).run(term);
  }

  /**
   * Get a mapper for the terms table whose key is the serial ID.
   */
  private getIDMapper(db: Kysely<Database>) {
    const upsertTransform = (term: Term) => {
      const values = {
        ...term,
        // spread doesn't get getters
        displayName: term.displayName,
        lookupName: term.lookupName,
      } as any;
      delete values["id"];
      return values;
    };

    return new TableMapper(db, "terms", {
      keyColumns: ["id"],
    }).withTransforms({
      insertTransform: upsertTransform,
      insertReturnTransform: (term: Term, returns) =>
        Term.create(
          {
            ...term,
            id: returns.id,
            // spread doesn't get getters
            displayName: term.displayName,
            lookupName: term.lookupName,
          },
          false
        ),
      updateTransform: upsertTransform,
      selectTransform: (row) => Term.create(row, false),
    });
  }

  /**
   * Get a mapper for the terms table whose key is a tuple of
   * glossary ID and lookup name.
   */
  private getKeyMapper(db: Kysely<Database>) {
    return new TableMapper(db, "terms", {
      keyColumns: ["glossaryId", "lookupName"],
    }).withTransforms({
      selectTransform: (row) => Term.create(row, false),
      insertTransform: () => {
        throw Error("Cannot insert via key mapper");
      },
    });
  }
}
