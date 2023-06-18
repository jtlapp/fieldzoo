import { Kysely } from "kysely";
import { TableMapper } from "kysely-mapper";

import { createBase64UUID } from "@fieldzoo/base64-uuid";
import {
  CollaborativeTable,
  Database,
  Glossaries,
} from "@fieldzoo/system-model";

import { Glossary } from "../entities/glossary";
import { GlossaryID } from "../values/glossary-id";

// export interface GlossaryPermissions {
//   glossary: Glossary;
//   permissions: Permissions;
// }

/**
 * Repository for persisting glossaries. Users are guaranteed to have admin
 * access to the glossaries they own, regardless of assigned permissions.
 * This ensures that a situation can't arise where a user is unable to
 * access their own glossaries.
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
   * Gets a glossary by ID, including its permissions for the given user.
   * @param id UUID of the glossary to get.
   * @param userID ID of the user to get permissions for.
   * @returns the glossary and its permissions, or null if the glossary was
   *  not found or the user has no permissions to the glosssary.
   */
  // async getByIDWithPermissions(
  //   glossaryID: GlossaryID,
  //   userID: UserID
  // ): Promise<GlossaryPermissions | null> {
  //   const results = await this.db
  //     .selectFrom("glossaries")
  //     .selectAll()
  //     .innerJoin("user_glossary_permissions", (qb) =>
  //       qb
  //         .on("user_glossary_permissions.glossaryID", "=", glossaryID)
  //         .on("user_glossary_permissions.userID", "=", userID)
  //     )
  //     .select("user_glossary_permissions.permissions as permissions")
  //     .where("id", "=", glossaryID)
  //     .union(
  //       sql`select *, ${Permissions.Admin} as permissions from glossaries where id=${glossaryID} and ownerID=${userID}`
  //     )
  //     .executeTakeFirst();

  //   return results !== undefined
  //     ? {
  //         glossary: Glossary.castFrom(results, false),
  //         permissions: results.permissions as Permissions,
  //       }
  //     : null;
  // }

  /**
   * Returns all glossaries to which a given user has explicit permissions.
   * @param userID ID of the user to get permissions for.
   * @returns the glossaries and their permissions, or an empty array if the
   *  user has no explicit permissions to any glossaries.
   */
  // async getForUser(userID: UserID): Promise<GlossaryPermissions[]> {
  //   const results = await this.db
  //     .selectFrom("glossaries")
  //     .selectAll()
  //     .innerJoin("user_glossary_permissions", (qb) =>
  //       qb
  //         .on("user_glossary_permissions.glossaryID", "=", "glossaries.id")
  //         .on("user_glossary_permissions.userID", "=", userID)
  //     )
  //     .select("user_glossary_permissions.permissions as permissions")
  //     .union(
  //       sql`select *, ${Permissions.Admin} as permissions from glossaries where ownerID=${userID}`
  //     )
  //     .execute();

  //   return results.map((result) => ({
  //     glossary: Glossary.castFrom(result, false),
  //     permissions: result.permissions as Permissions,
  //   }));
  // }

  /**
   * Set a user's permissions for a glossary.
   * @param userID ID of the user to set permissions for.
   * @param glossaryID ID of the glossary to set permissions for.
   * @param permissions Permissions to set.
   */
  // async setPermissions(
  //   userID: UserID,
  //   glossaryID: GlossaryID,
  //   permissions: Permissions
  // ): Promise<void> {
  //   await this.db
  //     .insertInto("user_glossary_permissions")
  //     .values({ userID, glossaryID, permissions })
  //     .onConflict((oc) =>
  //       oc.constraint("userID_glossaryID_key").doUpdateSet({ permissions })
  //     )
  //     .execute();
  // }

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
