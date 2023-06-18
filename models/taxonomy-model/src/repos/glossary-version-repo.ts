import { Kysely } from "kysely";
import { TableMapper } from "kysely-mapper";

import { Database, VersionNumber } from "@fieldzoo/system-model";

import { GlossaryID } from "../values/glossary-id";
import { GlossaryVersion } from "../entities/glossary-version";

/**
 * Repository for persisting glossary versions. Glossary versions are uniquely
 * identified via the tuple [glossary UUID, version number].
 */
export class GlossaryVersionRepo {
  readonly #table: ReturnType<GlossaryVersionRepo["getMapper"]>;

  constructor(readonly db: Kysely<Database>) {
    this.#table = this.getMapper(db);
  }

  /**
   * Adds a glossary version to the repository.
   * @param glossaryVersion Glossary version to add.
   */
  async add(glossaryVersion: GlossaryVersion): Promise<void> {
    await this.#table.insert().run(glossaryVersion);
  }

  /**
   * Deletes a glossary version by glossary ID.
   * @param id UUID of the glossary whose versions are to be deleted.
   * @returns true if the glossary versions were deleted, false if the
   *  glossary UUID was not found.
   */
  async deleteByGlossaryID(id: GlossaryID): Promise<boolean> {
    return this.#table.delete({ glossaryID: id }).run();
  }

  /**
   * Gets a glossary version by key.
   * @param key Key of the glossary version to get.
   * @returns the glossary version, or null if the glossary version was not found.
   */
  async getByKey(
    key: [GlossaryID, VersionNumber]
  ): Promise<GlossaryVersion | null> {
    return this.#table.select(key).returnOne();
  }

  /**
   * Gets summaries of glossary versions for a given glossary ID, sorted by
   * version number, with the highest version number first.
   * @param id ID of the glossary whose versions are to be retrieved.
   * @param offset Number of glossary versions to skip.
   * @param limit Maximum number of glossary versions to retrieve.
   * @returns summaries of the glossary versions, or an empty array if not
   *  found
   */
  async getSummaries(
    id: GlossaryID,
    offset: number,
    limit: number
  ): Promise<GlossaryVersionSummary[]> {
    return (await this.db
      .selectFrom("glossary_versions")
      .select([
        "glossaryID",
        "versionNumber",
        "modifiedBy",
        "modifiedAt",
        "whatChangedLine",
      ])
      .where("glossaryID", "=", id)
      .orderBy("versionNumber", "desc")
      .limit(limit)
      .offset(offset)
      .execute()) as GlossaryVersionSummary[];
  }

  /**
   * Gets a mapper for the glossary versions table.
   */
  private getMapper(db: Kysely<Database>) {
    return new TableMapper(db, "glossary_versions", {
      keyColumns: ["glossaryID", "versionNumber"],
      insertReturnColumns: [],
    }).withTransforms({
      insertTransform: (glossaryVersion: GlossaryVersion) => glossaryVersion,
      insertReturnTransform: (glossaryVersion: GlossaryVersion) =>
        glossaryVersion,
      updateTransform: () => {
        throw Error("GlossaryVersionRepo does not support updates");
      },
      selectTransform: (row) => GlossaryVersion.castFrom(row, false),
    });
  }
}

/**
 * Summary of a glossary version.
 */
export interface GlossaryVersionSummary {
  readonly glossaryID: GlossaryID;
  readonly versionNumber: VersionNumber;
  readonly modifiedBy: string;
  readonly modifiedAt: Date;
  readonly whatChangedLine: string;
}
