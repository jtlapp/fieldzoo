import { Kysely } from "kysely";

import { TermID, TermVersion } from "@fieldzoo/model";
import { TableMapper } from "kysely-mapper";

import { Database } from "../tables/table-interfaces";
import { VersionNumber } from "@fieldzoo/model/src/values/version-number";

/**
 * Repository for persisting term versions. Term versions are uniquely
 * identified via the tuple [database-internal term ID, version].
 */
export class TermVersionRepo {
  readonly #table: ReturnType<TermVersionRepo["getMapper"]>;

  constructor(readonly db: Kysely<Database>) {
    this.#table = this.getMapper(db);
  }

  /**
   * Adds a term version to the repository.
   * @param term Term to add.
   * @returns A new term instance with its generated ID.
   */
  async add(termVersion: TermVersion): Promise<void> {
    await this.#table.insert().run(termVersion);
  }

  /**
   * Deletes a term version by term ID.
   * @param id ID of the term whose versions are to be deleted.
   * @returns true if the term versions were deleted, false if the term
   *  ID was not found.
   */
  async deleteByTermID(id: TermID): Promise<boolean> {
    return this.#table.delete({ id }).run();
  }

  /**
   * Gets a term version by key.
   * @param key Key of the term version to get.
   * @returns the term version, or null if the term version was not found.
   */
  async getByKey(key: [TermID, VersionNumber]): Promise<TermVersion | null> {
    return this.#table.select(key).returnOne();
  }

  /**
   * Gets summaries of term versions for a given term ID, sorted by version
   * number, with the highest version number first.
   * @param id ID of the term whose versions are to be retrieved.
   * @param offset Number of term versions to skip.
   * @param limit Maximum number of term versions to retrieve.
   * @returns summaries of the term versions, or an empty array if not found
   */
  async getSummaries(
    termID: TermID,
    offset: number,
    limit: number
  ): Promise<TermVersionSummary[]> {
    return (await this.db
      .selectFrom("term_versions")
      .select(["id", "version", "modifiedBy", "modifiedAt", "whatChangedLine"])
      .where("id", "=", termID)
      .orderBy("version", "desc")
      .limit(limit)
      .offset(offset)
      .execute()) as TermVersionSummary[];
  }

  /**
   * Gets a mapper for the term versions table.
   */
  private getMapper(db: Kysely<Database>) {
    return new TableMapper(db, "term_versions", {
      keyColumns: ["id", "version"],
      insertReturnColumns: [],
    }).withTransforms({
      insertTransform: (termVersion: TermVersion) => termVersion,
      insertReturnTransform: (termVersion: TermVersion) => termVersion,
      updateTransform: () => {
        throw Error("TermVersionRepo does not support updates");
      },
      selectTransform: (row) => TermVersion.castFrom(row, false),
    });
  }
}

/**
 * Summary of a term version.
 */
export interface TermVersionSummary {
  readonly id: TermID;
  readonly version: VersionNumber;
  readonly modifiedBy: number;
  readonly modifiedAt: Date;
  readonly whatChangedLine: string;
}