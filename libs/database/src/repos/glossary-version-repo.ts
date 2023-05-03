import { Kysely } from "kysely";

import { GlossaryVersion, GlossaryID } from "@fieldzoo/model";
import { TableMapper } from "kysely-mapper";

import { Database } from "../tables/table-interfaces";
import { VersionNumber } from "@fieldzoo/model/src/values/version-number";

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
   * Deletes a glossary version by glossary UUID.
   * @param uuid UUID of the glossary whose versions are to be deleted.
   * @returns true if the glossary versions were deleted, false if the
   *  glossary UUID was not found.
   */
  async deleteByGlossaryUUID(uuid: GlossaryID): Promise<boolean> {
    return this.#table.delete({ uuid }).run();
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
   * @param uuid UUID of the glossary whose versions are to be retrieved.
   * @param offset Number of glossary versions to skip.
   * @param limit Maximum number of glossary versions to retrieve.
   * @returns summaries of the glossary versions, or an empty array if not
   *  found
   */
  async getSummaries(
    uuid: GlossaryID,
    offset: number,
    limit: number
  ): Promise<GlossaryVersionSummary[]> {
    return (await this.db
      .selectFrom("glossary_versions")
      .select([
        "uuid",
        "version",
        "modifiedBy",
        "modifiedAt",
        "whatChangedLine",
      ])
      .where("uuid", "=", uuid)
      .orderBy("version", "desc")
      .limit(limit)
      .offset(offset)
      .execute()) as GlossaryVersionSummary[];
  }

  /**
   * Gets a mapper for the glossary versions table.
   */
  private getMapper(db: Kysely<Database>) {
    return new TableMapper(db, "glossary_versions", {
      keyColumns: ["uuid", "version"],
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
  readonly uuid: GlossaryID;
  readonly version: VersionNumber;
  readonly modifiedBy: number;
  readonly modifiedAt: Date;
  readonly whatChangedLine: string;
}
