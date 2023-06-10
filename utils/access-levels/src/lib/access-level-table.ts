import { Kysely, SelectQueryBuilder } from "kysely";

import {
  KeyDataType,
  AccessLevelTableConfig,
} from "./access-level-table-config";

type KeyType<T extends KeyDataType> = T extends "integer" ? number : string;

/**
 * Class representing an access level table for the given resource table,
 * associating user/resource combinations with the user's access level to
 * the resource.
 */
export class AccessLevelTable<
  AccessLevel extends number,
  ResourceTableName extends string,
  UserKeyDT extends KeyDataType,
  ResourceKeyDT extends KeyDataType,
  UserKey extends KeyType<UserKeyDT> = KeyType<UserKeyDT>,
  ResourceKey extends KeyType<ResourceKeyDT> = KeyType<ResourceKeyDT>
> {
  private readonly config: Readonly<
    AccessLevelTableConfig<ResourceTableName, UserKeyDT, ResourceKeyDT>
  >;
  // cache values to improve performance
  private readonly tableName: string;
  private readonly foreignUserKeyColumn: string;
  private readonly foreignResourceKeyColumn: string;
  private readonly foreignResourceOwnerKeyColumn: string;
  private readonly internalUserKeyColumn: string;
  private readonly internalResourceKeyColumn: string;
  private readonly internalAccessLevelColumn: string;

  constructor(
    config: AccessLevelTableConfig<ResourceTableName, UserKeyDT, ResourceKeyDT>
  ) {
    this.config = { ...config };
    this.foreignUserKeyColumn = `${config.userTableName}.${config.userKeyColumn}`;
    this.foreignResourceKeyColumn = `${config.resourceTableName}.${config.resourceKeyColumn}`;
    this.foreignResourceOwnerKeyColumn = `${config.resourceTableName}.${config.ownerKeyColumn}`;
    this.tableName = `${config.resourceTableName}_access_levels`;
    this.internalUserKeyColumn = `${this.tableName}.userKey`;
    this.internalResourceKeyColumn = `${this.tableName}.resourceKey`;
    this.internalAccessLevelColumn = `${this.tableName}.accessLevel`;
  }

  /**
   * Creates an access level table for the given resource table. Indexes the
   * access level column for faster queries, and deletes the access level rows
   * when the associated user or resource is deleted.
   */
  async create(db: Kysely<any>) {
    await db.schema
      .createTable(this.tableName)
      .addColumn("userKey", this.config.userKeyDataType, (col) =>
        col.notNull().references(this.foreignUserKeyColumn).onDelete("cascade")
      )
      .addColumn("resourceKey", this.config.resourceKeyDataType, (col) =>
        col
          .notNull()
          .references(this.foreignResourceKeyColumn)
          .onDelete("cascade")
      )
      .addColumn("accessLevel", "integer", (col) => col.notNull())
      .addUniqueConstraint(`${this.tableName}_key`, ["userKey", "resourceKey"])
      .execute();

    await db.schema
      .createIndex(`${this.tableName}_index`)
      .on(this.tableName)
      .column("accessLevel")
      .execute();
  }

  /**
   * Drops the access level table for the given resource table.
   */
  async drop(db: Kysely<any>) {
    await db.schema.dropTable(this.tableName).execute();
  }

  /**
   * Returns the name of the access level table.
   * @returns The name of the access level table.
   */
  getTableName<DB, TB extends keyof DB & string>(): TB {
    return this.tableName as TB;
  }

  /**
   * Modifies a SELECT query builder that queries the resource of this table
   * so that it only returns rows where the user has the given minimum access
   * level. The resource owner always has full access to the resource.
   * @param db Database instance.
   * @param minimumAccessLevel Minimum access level required to access the
   *  resource.
   * @param userKey Key of user to check access for.
   * @param qb Query builder to modify.
   * @returns The modified query builder.
   */
  guardSelect<
    DB,
    O,
    QB extends SelectQueryBuilder<DB, keyof DB & ResourceTableName, O>
  >(
    db: Kysely<DB>,
    minimumAccessLevel: AccessLevel,
    userKey: UserKey,
    qb: QB
  ): QB {
    const ref = db.dynamic.ref.bind(db.dynamic);
    const foreignResourceOwnerKeyColumnRef = ref(
      this.foreignResourceOwnerKeyColumn
    );

    // TODO: return permissions (but should this be a separate method?)
    return qb.where(foreignResourceOwnerKeyColumnRef, "=", userKey).unionAll(
      qb
        .innerJoin(this.tableName as keyof DB & string, (join) =>
          join
            .on(ref(this.internalUserKeyColumn), "=", userKey)
            .onRef(
              ref(this.internalResourceKeyColumn),
              "=",
              ref(this.foreignResourceKeyColumn)
            )
        )
        // Including the contrary condition prevents UNION ALL duplicates
        // and allows the database to short-circuit if 1st condition holds.
        .where(foreignResourceOwnerKeyColumnRef, "!=", userKey)
        .where(ref(this.internalAccessLevelColumn), ">=", minimumAccessLevel)
    ) as QB;
  }

  // guardUpdate<
  //   DB,
  //   TB extends keyof DB & string,
  //   O,
  //   QB extends UpdateQueryBuilder<DB, any, TB, O>
  // >(
  //   db: Kysely<any>,
  //   minimumAccessLevel: AccessLevel,
  //   userKey: UserKey,
  //   qb: QB
  // ): QB {
  //   const ref = db.dynamic.ref.bind(db.dynamic);
  //   const foreignResourceOwnerKeyColumnRef = ref(
  //     this.foreignResourceOwnerKeyColumn
  //   );

  //   return qb.where(({ or, cmpr }) =>
  //     or([
  //       cmpr(foreignResourceOwnerKeyColumnRef, "=", userKey),
  //       cmpr(
  //         // TODO: what does this do? do I even need a join?
  //         db
  //           .selectFrom(this.config.resourceTableName)
  //           .select("accessLevel")
  //           .innerJoin(this.tableName as keyof DB & string, (join) =>
  //             join
  //               .on(ref(this.internalUserKeyColumn), "=", userKey)
  //               .onRef(
  //                 ref(this.internalResourceKeyColumn),
  //                 "=",
  //                 ref(this.foreignResourceKeyColumn)
  //               )
  //           )
  //           // Including the contrary condition prevents UNION ALL duplicates
  //           // and allows the database to short-circuit if 1st condition holds.
  //           .where(foreignResourceOwnerKeyColumnRef, "!=", userKey),
  //         ">=",
  //         minimumAccessLevel
  //       ),
  //     ])
  //   ) as QB;
  // }

  /**
   * Sets the access level of a user to the given resource. Setting an access
   * level of 0 removes the user's access level assignment.
   * @param db Database instance.
   * @param userKey Key of user to grant access to.
   * @param resourceKey Key of resource to grant access to.
   * @param accessLevel Access level to assign.
   */
  async setAccessLevel(
    db: Kysely<any>,
    userKey: UserKey,
    resourceKey: ResourceKey,
    accessLevel: AccessLevel
  ) {
    if (accessLevel === 0) {
      await db
        .deleteFrom(this.tableName as keyof any & string)
        .where("userKey", "=", userKey)
        .where("resourceKey", "=", resourceKey)
        .execute();
    } else {
      await db
        .insertInto(this.tableName as keyof any & string)
        .values({
          userKey,
          resourceKey,
          accessLevel,
        })
        .execute();
    }
  }

  // TODO: Is there a way for me to type check this, maybe in a test?
}
