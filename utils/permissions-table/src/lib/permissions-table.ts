import { Kysely, SelectQueryBuilder, sql } from "kysely";

import {
  KeyDataType,
  KeyType,
  PermissionsTableConfig,
} from "./permissions-table-config";

// TODO: look at using sql.id or sql.ref instead of catting

// TODO: support public permissionss

// TODO: look at making owners optional

/**
 * Class representing user permissions to resources indicated by rows in a
 * resources table. Each resource has an owner who also has full permissions,
 * regardless of whether the permissions table assigns permissions to the
 * owner. Permissions are merely numbers, so they can be used to represent
 * permissionss or privilege flags, etc.
 */
export class PermissionsTable<
  ResourceTableName extends string,
  UserKeyDT extends KeyDataType,
  ResourceKeyDT extends KeyDataType,
  Permissions extends number,
  UserKey extends KeyType<UserKeyDT> = KeyType<UserKeyDT>,
  ResourceKey extends KeyType<ResourceKeyDT> = KeyType<ResourceKeyDT>
> {
  private readonly config: Readonly<
    PermissionsTableConfig<
      ResourceTableName,
      UserKeyDT,
      ResourceKeyDT,
      Permissions,
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
    config: PermissionsTableConfig<
      ResourceTableName,
      UserKeyDT,
      ResourceKeyDT,
      Permissions,
      UserKey,
      ResourceKey
    >
  ) {
    this.config = { ...config };
    this.foreignUserKeyColumn = `${config.userTableName}.${config.userKeyColumn}`;
    this.foreignResourceKeyColumn = `${config.resourceTableName}.${config.resourceKeyColumn}`;
    this.foreignResourceOwnerKeyColumn = `${config.resourceTableName}.${config.resourceOwnerKeyColumn}`;
    this.tableName = `${config.resourceTableName}_permissions`;
    this.internalUserKeyColumn = `${this.tableName}.userKey`;
    this.internalResourceKeyColumn = `${this.tableName}.resourceKey`;
    this.internalAccessLevelColumn = `${this.tableName}.permissions`;
  }

  /**
   * Creates a permissions table for the given resource table. Permissions
   * table rows are deleted when the associated user or resource is deleted.
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
      .addColumn("permissions", "integer", (col) => col.notNull())
      .addUniqueConstraint(`${this.tableName}_key`, ["userKey", "resourceKey"])
      .execute();
  }

  /**
   * Drops the permissions table for the given resource table.
   */
  async drop(db: Kysely<any>) {
    await db.schema.dropTable(this.tableName).execute();
  }

  /**
   * Modifies a SELECT query builder that queries the resource of this table
   * so that it only returns rows where the user has the requested minimum
   * permissions. The resource owner always has full access to the resource.
   * @param db Database instance.
   * @param minRequiredAccessLevel Minimum permissions required to access the
   *  resource.
   * @param userKey Key of user to check access for.
   * @param qb Query builder to modify, which must select from the resource
   *  table, though it need not select any columns.
   * @returns The modified query builder.
   */
  getPermissions<
    DB,
    O,
    QB extends SelectQueryBuilder<DB, keyof DB & ResourceTableName, O>
  >(
    db: Kysely<DB>,
    minRequiredAccessLevel: Permissions,
    userKey: UserKey,
    qb: QB
  ): QB {
    const ref = db.dynamic.ref.bind(db.dynamic);
    const foreignResourceOwnerKeyColumnRef = ref(
      this.foreignResourceOwnerKeyColumn
    );

    return qb
      .select(sql.lit(this.config.ownerPermissions).as("permissions"))
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
              .ref<Permissions>(this.internalAccessLevelColumn)
              .as("permissions")
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
   * Returns the name of the permissions table.
   * @returns The name of the permissions table.
   */
  getTableName<DB, TB extends keyof DB & string>(): TB {
    return this.tableName as TB;
  }

  /**
   * Sets the permissions of a user to the given resource. Setting an access
   * level of 0 removes the user's permissions assignment.
   * @param db Database instance.
   * @param userKey Key of user to grant access to.
   * @param resourceKey Key of resource to grant access to.
   * @param permissions Access level to assign.
   */
  async setAccessLevel(
    db: Kysely<any>,
    userKey: UserKey,
    resourceKey: ResourceKey,
    permissions: Permissions
  ) {
    if (permissions === 0) {
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
          permissions,
        })
        .execute();
    }
  }

  // Alternative implementation using a left join instead of a union. Keeping
  // around for possible performance testing later.

  // guardSelectingAccessLevel<DB, TB extends keyof DB & ResourceTableName>(
  //   db: Kysely<DB>,
  //   minRequiredAccessLevel: Permissions,
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
  //         .as("permissions")
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
