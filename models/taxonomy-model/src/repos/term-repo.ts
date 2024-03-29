import { Kysely } from "kysely";
import { TableMapper } from "kysely-mapper";

import { NormalizedName } from "@fieldzoo/general-model";
import { CollaborativeTable, Database, Terms } from "@fieldzoo/system-model";

import { GlossaryID } from "../values/glossary-id";
import { Term } from "../entities/term";
import { TermID } from "../values/term-id";

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
   * Adds a term to the repository.
   * @param term Term to add.
   * @returns A new term instance with its generated ID.
   */
  async add(term: Term): Promise<Term> {
    return this.#idTable.insert().returnOne(term);
  }

  /**
   * Deletes a term by ID.
   * @param id ID of the term to delete.
   * @returns true if the term was deleted, false if the term
   *  was not found.
   */
  async deleteByID(id: TermID): Promise<boolean> {
    return this.#idTable.delete(id).run();
  }

  /**
   * Gets a term by key.
   * @param key Key of the term to get.
   * @returns the term, or null if the term was not found.
   */
  async getByKey(key: [GlossaryID, NormalizedName]): Promise<Term | null> {
    return this.#keyTable.select(key).returnOne();
  }

  /**
   * Updates a term, including changing its `modifiedAt` date.
   * @param term Term with modified values.
   * @returns Whether the term was found and updated.
   */
  async update(term: Term): Promise<boolean> {
    return (await this.#idTable.update(term.id).returnOne(term)) !== null;
  }

  /**
   * Gets a mapper for the terms table whose key is the serial ID.
   */
  private getIDMapper(db: Kysely<Database>) {
    const upsertTransform = (term: Term) => {
      const values = CollaborativeTable.removeGeneratedValues({
        ...term,
        displayName: term.displayName,
        lookupName: term.lookupName,
      });
      delete values["id"];
      return values;
    };

    return new TableMapper(db, "terms", {
      keyColumns: ["id"],
      insertReturnColumns: CollaborativeTable.addInsertReturnColumns<Terms>([
        "id",
      ]),
      updateReturnColumns: CollaborativeTable.addUpdateReturnColumns<Terms>(),
    }).withTransforms({
      insertTransform: upsertTransform,
      insertReturnTransform: (term: Term, returns) =>
        Term.castFrom(
          {
            ...term,
            ...returns,
            displayName: term.displayName,
            lookupName: term.lookupName,
          },
          false
        ),
      updateTransform: upsertTransform,
      updateReturnTransform: (term: Term, returns) =>
        Object.assign(term, returns) as Term,
      selectTransform: (row) => Term.castFrom(row, false),
    });
  }

  /**
   * Gets a mapper for the terms table whose key is a tuple of
   * glossary ID and lookup name.
   */
  private getKeyMapper(db: Kysely<Database>) {
    return new TableMapper(db, "terms", {
      keyColumns: ["glossaryID", "lookupName"],
    }).withTransforms({
      selectTransform: (row) => Term.castFrom(row, false),
      insertTransform: () => {
        throw Error("Cannot insert via key mapper");
      },
    });
  }
}
