import {
  DeleteQueryBuilder,
  Kysely,
  SelectQueryBuilder,
  UpdateQueryBuilder,
} from "kysely";

/**
 * Postgres data type for the user and resource key columns.
 */
export type KeyDataType = "integer" | "text" | "uuid";

type KeyType<T extends KeyDataType> = T extends "integer" ? number : string;

// TODO: I think I'd rather set the JS key types and infer the data types,
// but that's not possible because multiple data types can map to the same JS type.
// For nominal typing, I do need to set the JS types.

/**
 * Class representing an access level table for the given resource table,
 * associating user/resource combinations with the user's access level to
 * the resource.
 */
export class AccessLevelTable<
  AccessLevel extends number,
  UserKeyDT extends KeyDataType,
  ResourceKeyDT extends KeyDataType
> {
  private readonly tableName: string;
  private readonly resourceTableDotKeyColumn: string;
  private readonly resourceTableDotOwnerKeyColumn: string;

  constructor(
    readonly userTableDotKeyColumn: string,
    readonly userKeyDataType: UserKeyDT,
    readonly resourceTableName: string,
    readonly resourceKeyColumn: string,
    readonly resourceKeyDataType: ResourceKeyDT,
    readonly ownerKeyColumn: string
  ) {
    this.resourceTableDotKeyColumn = `${resourceTableName}.${resourceKeyColumn}`;
    this.resourceTableDotOwnerKeyColumn = `${resourceTableName}.${ownerKeyColumn}`;
    this.tableName = `${resourceTableName}_access_levels`;
  }

  /**
   * Creates an access level table for the given resource table. Indexes the
   * access level column for faster queries, and deletes the access level rows
   * when the associated user or resource is deleted.
   */
  async create(db: Kysely<any>) {
    await db.schema
      .createTable(this.tableName)
      .addColumn("userKey", this.userKeyDataType, (col) =>
        col.notNull().references(this.userTableDotKeyColumn).onDelete("cascade")
      )
      .addColumn("resourceKey", this.resourceKeyDataType, (col) =>
        col
          .notNull()
          .references(this.resourceTableDotKeyColumn)
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

  getTableName() {
    return `${this.resourceTableName}_access_levels`;
  }

  /**
   * Modifies a query builder that queries the resource of this table so that
   * it only returns rows where the user has the given minimum access level.
   * The resource owner always has full access to the resource.
   * @param db Database instance.
   * @param minimumAccessLevel Minimum access level required to access the
   *  resource.
   * @param userKey Key of user to check access for.
   * @param qb Query builder to modify.
   * @returns The modified query builder, supporting only WHERE clauses.
   */
  restrictQuery<
    DB,
    TB extends keyof DB & string,
    O,
    QB extends
      | SelectQueryBuilder<DB, TB, O>
      | UpdateQueryBuilder<DB, any, TB, O>
      | DeleteQueryBuilder<DB, TB, O>
  >(
    db: Kysely<any>,
    minimumAccessLevel: AccessLevel,
    userKey: KeyType<UserKeyDT>,
    qb: QB
  ): QB {
    const ref = db.dynamic.ref.bind(db.dynamic);
    const resourceTableDotOwnerKeyColumnRef = ref(
      this.resourceTableDotOwnerKeyColumn
    );
    // pick a QB just to satisfy the type checker
    const selectQB = qb as SelectQueryBuilder<DB, TB, any>;

    // TODO: cache the string cat refs
    return selectQB
      .where(resourceTableDotOwnerKeyColumnRef, "=", userKey)
      .unionAll(
        selectQB
          .innerJoin(this.tableName as keyof DB & string, (join) =>
            join
              .on(ref(`${this.tableName}.userKey`), "=", userKey)
              .onRef(
                ref(`${this.tableName}.resourceKey`),
                "=",
                ref(this.resourceTableDotKeyColumn)
              )
          )
          // Including the contrary condition prevents UNION ALL duplicates
          // and allows the database to short-circuit if 1st condition holds.
          .where(resourceTableDotOwnerKeyColumnRef, "!=", userKey)
          .where(ref(`${this.tableName}.accessLevel`), ">=", minimumAccessLevel)
      ) as QB;
  }

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
    userKey: KeyType<UserKeyDT>,
    resourceKey: KeyType<ResourceKeyDT>,
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

  /**
   * Returns the access level of a user to the given resource.
   * @param db Database instance.
   * @param userKey Key of user to check access for.
   * @param resourceKey Key of resource to check access for.
   * @returns The access level of the user to the resource, or `null` if no
   *  access level has been assigned to the user for this resource.
   */
  async getAccessLevel(
    db: Kysely<any>,
    userKey: KeyType<UserKeyDT>,
    resourceKey: KeyType<ResourceKeyDT>
  ): Promise<AccessLevel | null> {
    // TODO: what about case where user owns the resource?
    const result = await db
      .selectFrom(this.tableName as keyof any & string)
      .select("accessLevel")
      .where("userKey", "=", userKey)
      .where("resourceKey", "=", resourceKey)
      .executeTakeFirst();
    return result?.accessLevel ?? null;
  }

  // TODO: Is there a way for me to type check this, maybe in a test?
}
