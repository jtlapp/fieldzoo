import { Kysely } from "kysely";
import { TableMapper } from "kysely-mapper";

import { Database } from "@fieldzoo/database";

import { TermID } from "../values/term-id";
import { TermVersion } from "../entities/term-version";
import { VersionNumber } from "../values/version-number";

/**
 * Repository for persisting term versions. Term versions are uniquely
 * identified via the tuple [database-internal term ID, version number].
 */
export class TermVersionRepo {
  readonly #table: ReturnType<TermVersionRepo["getMapper"]>;

  constructor(readonly db: Kysely<Database>) {
    this.#table = this.getMapper(db);
  }

  /**
   * Adds a term version to the repository.
   * @param termVersion Term version to add.
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
    id: TermID,
    offset: number,
    limit: number
  ): Promise<TermVersionSummary[]> {
    return (await this.db
      .selectFrom("term_versions")
      .select([
        "id",
        "versionNumber",
        "modifiedBy",
        "modifiedAt",
        "whatChangedLine",
      ])
      .where("id", "=", id)
      .orderBy("versionNumber", "desc")
      .limit(limit)
      .offset(offset)
      .execute()) as TermVersionSummary[];
  }

  /**
   * Gets a mapper for the term versions table.
   */
  private getMapper(db: Kysely<Database>) {
    return new TableMapper(db, "term_versions", {
      keyColumns: ["id", "versionNumber"],
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
  readonly versionNumber: VersionNumber;
  readonly modifiedBy: string;
  readonly modifiedAt: Date;
  readonly whatChangedLine: string;
}
