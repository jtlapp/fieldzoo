import {
  InsertQueryBuilder,
  InsertResult,
  Insertable,
  Kysely,
  SelectQueryBuilder,
  Selectable,
  WhereInterface,
  sql,
} from "kysely";

import {
  KeyDataType,
  KeyType,
  AccessLevelTableConfig,
} from "./access-level-table-config";

// TODO: consider renaming class to "QueryGuard" or similar

// TODO: look at using sql.id or sql.ref instead of catting

// TODO: support public access levels

/**
 * Class representing an access level table for the given resource table,
 * associating user/resource combinations with the user's access level to
 * the resource.
 */
export class AccessLevelTable<
  ResourceTableName extends string,
  UserKeyDT extends KeyDataType,
  ResourceKeyDT extends KeyDataType,
  AccessLevel extends number,
  UserKey extends KeyType<UserKeyDT> = KeyType<UserKeyDT>,
  ResourceKey extends KeyType<ResourceKeyDT> = KeyType<ResourceKeyDT>
> {
  private readonly config: Readonly<
    AccessLevelTableConfig<
      ResourceTableName,
      UserKeyDT,
      ResourceKeyDT,
      AccessLevel,
      UserKey,
      ResourceKey
    >
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
    config: AccessLevelTableConfig<
      ResourceTableName,
      UserKeyDT,
      ResourceKeyDT,
      AccessLevel,
      UserKey,
      ResourceKey
    >
  ) {
    this.config = { ...config };
    this.foreignUserKeyColumn = `${config.userTableName}.${config.userKeyColumn}`;
    this.foreignResourceKeyColumn = `${config.resourceTableName}.${config.resourceKeyColumn}`;
    this.foreignResourceOwnerKeyColumn = `${config.resourceTableName}.${config.resourceOwnerKeyColumn}`;
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
   * Inserts a row into the indicated table
   */
  // TODO: restrict resourceReferenceColumn to columns of the right type
  // TODO: make the args more manageable
  guardInsert<DB, TB extends keyof DB & string>(
    db: Kysely<DB>,
    minRequiredAccessLevel: AccessLevel,
    userKey: UserKey,
    // TODO: look into accepting a query that I parse to get the values,
    //  but only do so after fixing the other query methods
    intoTable: TB,
    values: Insertable<DB[TB]>,
    resourceReferenceColumn: keyof Insertable<DB[TB]> & string
  ): InsertQueryBuilder<DB, TB, InsertResult>;

  guardInsert<
    DB,
    TB extends keyof DB & string,
    R extends keyof Selectable<DB[TB]> & string
  >(
    db: Kysely<DB>,
    minRequiredAccessLevel: AccessLevel,
    userKey: UserKey,
    intoTable: TB,
    values: Insertable<DB[TB]>,
    resourceReferenceColumn: keyof Insertable<DB[TB]> & string,
    returning: R
  ): InsertQueryBuilder<DB, TB, Pick<Selectable<DB[TB]>, R>>;

  guardInsert<
    DB,
    TB extends keyof DB & string,
    R extends (keyof Selectable<DB[TB]> & string)[]
  >(
    db: Kysely<DB>,
    minRequiredAccessLevel: AccessLevel,
    userKey: UserKey,
    intoTable: TB,
    values: Insertable<DB[TB]>,
    resourceReferenceColumn: keyof Insertable<DB[TB]> & string,
    returning: R
  ): InsertQueryBuilder<DB, TB, Pick<Selectable<DB[TB]>, R[number]>>;

  guardInsert<DB, TB extends keyof DB & string>(
    db: Kysely<DB>,
    minRequiredAccessLevel: AccessLevel,
    userKey: UserKey,
    intoTable: TB,
    values: Insertable<DB[TB]>,
    resourceReferenceColumn: keyof Insertable<DB[TB]> & string,
    returning: "*"
  ): InsertQueryBuilder<DB, TB, Selectable<DB[TB]>>;

  guardInsert<DB, TB extends keyof DB & string>(
    db: Kysely<DB>,
    minRequiredAccessLevel: AccessLevel,
    userKey: UserKey,
    intoTable: TB,
    values: Insertable<DB[TB]>,
    resourceReferenceColumn: keyof Insertable<DB[TB]> & string,
    returning?:
      | Readonly<keyof Selectable<DB[TB]> & string>
      | Readonly<(keyof Selectable<DB[TB]> & string)[]>
      | "*"
  ) {
    const query = db
      .insertInto(intoTable)
      .columns(Object.keys(values) as (keyof DB[TB] & string)[])
      .expression(
        sql`select ${sql.join(Object.values(values))} where exists (
          select 1 from ${sql.table(this.config.resourceTableName)}
            where ${sql.ref(this.foreignResourceKeyColumn)} = ${sql.lit(
          values[resourceReferenceColumn]
        )} and (  
            ${sql.ref(this.foreignResourceOwnerKeyColumn)} = ${userKey} or
              exists (select 1 from ${sql.table(this.tableName)}
                where ${sql.ref(this.internalUserKeyColumn)} = ${userKey} and
                  ${sql.ref(this.internalResourceKeyColumn)} = ${sql.ref(
          this.foreignResourceKeyColumn
        )} and
                  ${sql.ref(this.internalAccessLevelColumn)} >= ${sql.lit(
          minRequiredAccessLevel
        )})))`
      );
    return returning === undefined
      ? query
      : returning == "*"
      ? query.returningAll()
      : Array.isArray(returning)
      ? query.returning(returning)
      : query.returning(returning as keyof Selectable<DB[TB]> & string);
  }

  /**
   * Modifies a query builder that queries the resource of this table so that
   * it only returns rows where the user has the requested minimum access
   * level. The resource owner always has full access to the resource.
   * @param db Database instance.
   * @param minRequiredAccessLevel Minimum access level required to access the
   *  resource.
   * @param userKey Key of user to check access for.
   * @param qb Query builder to modify, which must query at least in part from
   *  the resource table, though it need not select any columns.
   * @returns The modified query builder.
   */
  guardQuery<DB, QB extends WhereInterface<DB, keyof DB & ResourceTableName>>(
    db: Kysely<any>, // TODO: should this be `any`?
    minRequiredAccessLevel: AccessLevel,
    userKey: UserKey,
    qb: QB
  ): QB {
    const ref = db.dynamic.ref.bind(db.dynamic);
    return qb.where(({ or, cmpr, exists }) =>
      or([
        cmpr(ref(this.config.resourceOwnerKeyColumn), "=", userKey),
        exists(
          // reference prefixed columns to avoid conflicts
          db
            .selectFrom(this.tableName)
            .selectAll() // TODO: select a literal
            .where(ref(this.internalUserKeyColumn), "=", userKey)
            .whereRef(
              ref(this.internalResourceKeyColumn),
              "=",
              ref(this.foreignResourceKeyColumn)
            )
            .where(
              ref(this.internalAccessLevelColumn),
              ">=",
              minRequiredAccessLevel
            )
        ),
      ])
    ) as QB;
  }

  /**
   * Modifies a SELECT query builder that queries the resource of this table
   * so that it only returns rows where the user has the requested minimum
   * access level. The resource owner always has full access to the resource.
   * @param db Database instance.
   * @param minRequiredAccessLevel Minimum access level required to access the
   *  resource.
   * @param userKey Key of user to check access for.
   * @param qb Query builder to modify, which must select from the resource
   *  table, though it need not select any columns.
   * @returns The modified query builder.
   */
  guardSelectingAccessLevel<
    DB,
    O,
    QB extends SelectQueryBuilder<DB, keyof DB & ResourceTableName, O>
  >(
    db: Kysely<DB>,
    minRequiredAccessLevel: AccessLevel,
    userKey: UserKey,
    qb: QB
  ): QB {
    const ref = db.dynamic.ref.bind(db.dynamic);
    const foreignResourceOwnerKeyColumnRef = ref(
      this.foreignResourceOwnerKeyColumn
    );

    return qb
      .select(sql.lit(this.config.ownerAccessLevel).as("accessLevel"))
      .where(foreignResourceOwnerKeyColumnRef, "=", userKey)
      .unionAll(
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
          .select(
            sql
              .ref<AccessLevel>(this.internalAccessLevelColumn)
              .as("accessLevel")
          )
          // Including the contrary condition prevents UNION ALL duplicates
          // and allows the database to short-circuit if 1st condition holds.
          .where(foreignResourceOwnerKeyColumnRef, "!=", userKey)
          .where(
            ref(this.internalAccessLevelColumn),
            ">=",
            minRequiredAccessLevel
          )
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

  // Alternative implementation using a left join instead of a union. Keeping
  // around for possible performance testing later.

  // guardSelectingAccessLevel<DB, TB extends keyof DB & ResourceTableName>(
  //   db: Kysely<DB>,
  //   minRequiredAccessLevel: AccessLevel,
  //   userKey: UserKey
  // ) {
  //   const resourceTableName = this.config.resourceTableName as unknown as TB;
  //   const ref = db.dynamic.ref.bind(db.dynamic);

  //   return db
  //     .selectFrom(resourceTableName)
  //     .selectAll(resourceTableName as ExtractTableAlias<DB, TB>)
  //     .select(
  //       db.fn
  //         .coalesce(
  //           ref(this.internalAccessLevelColumn),
  //           sql.lit(this.config.ownerAccessLevel)
  //         )
  //         .as("accessLevel")
  //     )
  //     .leftJoin(this.tableName as keyof DB & string, (join) =>
  //       join
  //         .on(ref(this.internalUserKeyColumn), "=", userKey)
  //         .onRef(
  //           ref(this.internalResourceKeyColumn),
  //           "=",
  //           ref(this.foreignResourceKeyColumn)
  //         )
  //     )
  //     .where(
  //       sql`${sql.ref(this.foreignResourceOwnerKeyColumn)} = ${userKey} or
  //         ${sql.ref(
  //           this.internalAccessLevelColumn
  //         )} >= ${minRequiredAccessLevel}`
  //     );
  // }
}
