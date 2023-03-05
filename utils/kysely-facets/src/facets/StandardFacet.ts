import {
  Kysely,
  Insertable,
  ReferenceExpression,
  Selectable,
  UpdateObject,
  UpdateQueryBuilder,
} from "kysely";
import { SelectAllQueryBuilder } from "kysely/dist/cjs/parser/select-parser";

import { KyselyFacet } from "./KyselyFacet";
import { QueryFilter, applyQueryFilter } from "../lib/QueryFilter";

// TODO: delete this if not needed
//
// interface TakeFirstBuilder<O> {
//   executeTakeFirst(): Promise<SingleResultType<O>>;
// }
// interface TakeManyBuilder<O> {
//   execute(): Promise<O[]>;
// }

export class StandardFacet<
  DB,
  TableName extends keyof DB & string
> extends KyselyFacet<DB, TableName> {
  /**
   * Constructs a new Kysely table.
   * @param db The Kysely database.
   * @param tableName The name of the table.
   */
  constructor(db: Kysely<DB>, tableName: TableName) {
    super(db, tableName);
  }

  /**
   * Inserts a single row into this table, optionally returning columns
   * from the inserted row.
   * @param obj The object to insert as a row.
   * @param returning The columns to return from the inserted row. If
   *    `["*"]` is given, all columns are returned. If a list of field names
   *    is given, returns only those field names. If omitted, no columns
   *    are returned. Useful for getting auto-generated columns.
   * @returns An object containing the requested return columns, if any.
   *    Returns `void` when `returning` is omitted.
   */
  insertOne(obj: Insertable<DB[TableName]>): Promise<void>;

  insertOne<O extends Selectable<DB[TableName]>, R extends keyof O>(
    obj: Insertable<DB[TableName]>,
    returning: R[]
  ): Promise<Pick<O, R>>;

  insertOne<O extends Selectable<DB[TableName]>>(
    obj: Insertable<DB[TableName]>,
    returning: ["*"]
  ): Promise<Selectable<DB[TableName]>>;

  async insertOne<
    O extends Selectable<DB[TableName]>,
    R extends keyof O & keyof DB[TableName] & string
  >(
    obj: Insertable<DB[TableName]>,
    returning?: R[] | ["*"]
  ): Promise<Selectable<DB[TableName]> | Pick<O, R> | void> {
    const qb = this.insertRows().values(obj);
    if (returning) {
      // Cast here because TS wasn't allowing the check.
      if ((returning as string[]).includes("*")) {
        const result = await qb.returningAll().executeTakeFirstOrThrow();
        return result as Selectable<DB[TableName]>;
      }
      if (returning.length > 0) {
        const result = await qb
          .returning(returning as any)
          .executeTakeFirstOrThrow();
        return result as Pick<O, R>;
      }
      await qb.execute();
      return {} as Pick<O, R>;
    }
    await qb.execute();
  }

  /**
   * Inserts multiple rows into this table, optionally returning columns
   * from the inserted rows.
   * @param objs The objects to insert as rows.
   * @param returning The columns to return from the inserted rows. If
   *   `["*"]` is given, all columns are returned. If a list of field names
   *    is given, returns only those field names. If omitted, no columns
   *    are returned. Useful for getting auto-generated columns.
   * @returns An array of objects containing the requested return columns,
   *   if any. Returns `void` when `returning` is omitted.
   */
  insertMany(objs: Insertable<DB[TableName]>[]): Promise<void>;

  insertMany<O extends Selectable<DB[TableName]>, R extends keyof O>(
    objs: Insertable<DB[TableName]>[],
    returning: R[]
  ): Promise<Pick<O, R>[]>;

  insertMany<O extends Selectable<DB[TableName]>>(
    objs: Insertable<DB[TableName]>[],
    returning: ["*"]
  ): Promise<Selectable<DB[TableName]>[]>;

  async insertMany<
    O extends Selectable<DB[TableName]>,
    R extends keyof O & keyof DB[TableName] & string
  >(
    objs: Insertable<DB[TableName]>[],
    returning?: R[] | ["*"]
  ): Promise<Selectable<DB[TableName]>[] | Pick<O, R>[] | void> {
    const qb = this.insertRows().values(objs);
    if (returning) {
      // Cast here because TS wasn't allowing the check.
      if ((returning as string[]).includes("*")) {
        const result = await qb.returningAll().execute();
        return result as Selectable<DB[TableName]>[];
      }
      if (returning.length > 0) {
        const result = await qb.returning(returning as any).execute();
        return result as Pick<O, R>[];
      }
      await qb.execute();
      return objs.map((_) => ({})) as Pick<O, R>[];
    }
    await qb.execute();
  }

  /**
   * TODO: update this comment
   *
   * Selects zero or more rows from this table. If no arguments are given,
   * selects all rows. If three arguments are given, selects rows that
   * match the binary operation. If one argument is given and it's a callback,
   * the callback takes a query builder and returns a query builder that
   * constrains the selection. If one argument is given and it's not a callback,
   * selects rows that match the expression.
   * @param lhs The left-hand side of the binary operation.
   * @param op The operator of the binary operation.
   * @param rhs The right-hand side of the binary operation.
   * @param callback A callback that takes a query builder and returns a
   *    query builder that constrains the selection.
   * @param expression An expression that constrains the selection.
   * @returns An array of objects containing the selected rows, possibly empty.
   */
  selectMany(): Promise<Selectable<DB[TableName]>[]>;

  selectMany<
    QB extends SelectAllQueryBuilder<DB, TableName, object, TableName>,
    RE extends ReferenceExpression<DB, TableName>
  >(
    filter: QueryFilter<DB, TableName, QB, RE>
  ): Promise<Selectable<DB[TableName]>[]>;

  async selectMany<
    QB extends SelectAllQueryBuilder<DB, TableName, object, TableName>,
    RE extends ReferenceExpression<DB, TableName>
  >(filter?: QueryFilter<DB, TableName, QB, RE>): Promise<any> {
    let qb = this.selectRows().selectAll();
    if (filter !== undefined) {
      // Cast because TS was erroring, "Type X cannot be assigned to type X".
      qb = applyQueryFilter(this, filter)(qb as any) as any;
    }
    return qb.execute();
  }

  /**
   * TODO: update this comment
   *
   * Selects at most one row from this table. If no arguments are given,
   * selects the first row. If three arguments are given, selects the first
   * row that matches the binary operation. If one argument is given and it's
   * a callback, the callback takes a query builder and returns a query builder
   * that constrains the selection. If one argument is given and it's not a
   * callback, selects the first row that matches the expression.
   * @param lhs The left-hand side of the binary operation.
   * @param op The operator of the binary operation.
   * @param rhs The right-hand side of the binary operation.
   * @param callback A callback that takes a query builder and returns a
   *    query builder that constrains the selection.
   * @param expression An expression that constrains the selection.
   * @returns An object containing the selected row, or `null` if no row
   *    was selected.
   */
  selectOne(): Promise<Selectable<DB[TableName]> | null>;

  selectOne<
    QB extends SelectAllQueryBuilder<DB, TableName, object, TableName>,
    RE extends ReferenceExpression<DB, TableName>
  >(
    filter: QueryFilter<DB, TableName, QB, RE>
  ): Promise<Selectable<DB[TableName]> | null>;

  async selectOne<
    QB extends SelectAllQueryBuilder<DB, TableName, object, TableName>,
    RE extends ReferenceExpression<DB, TableName>
  >(filter?: QueryFilter<DB, TableName, QB, RE>): Promise<any> {
    let qb = this.selectRows().selectAll();
    if (filter !== undefined) {
      // Cast because TS was erroring, "Type X cannot be assigned to type X".
      qb = applyQueryFilter(this, filter)(qb as any) as any;
    }
    return (await qb.executeTakeFirst()) || null;
  }

  /**
   * Updates rows in this table matching the provided column values,
   * optionally returning columns from the updated rows.
   * @param match Object providing the values of columns to match.
   * @param obj The object whose fields are to update the row.
   * @param returning The columns to return from the updated row. If
   *    `["*"]` is given, all columns are returned. If a list of field names
   *    is given, returns only those field names. If omitted, no columns
   *    are returned. Useful for getting auto-generated columns.
   * @returns If `returning` was provided, returns an array of objects
   *    having the requested returned column values. Otherwise, returns
   *    the number of rows updated.
   */
  updateByMatch<
    QB extends UpdateQueryBuilder<DB, TableName, TableName, object>,
    RE extends ReferenceExpression<DB, TableName>
  >(
    filter: QueryFilter<DB, TableName, QB, RE>,
    obj: UpdateObject<DB, TableName>
  ): Promise<number>;

  updateByMatch<
    QB extends UpdateQueryBuilder<DB, TableName, TableName, object>,
    RE extends ReferenceExpression<DB, TableName>,
    R extends keyof Selectable<DB[TableName]> & string
  >(
    filter: QueryFilter<DB, TableName, QB, RE>,
    obj: UpdateObject<DB, TableName>,
    returning: R[]
  ): Promise<Pick<Selectable<DB[TableName]>, R>[]>;

  updateByMatch<
    QB extends UpdateQueryBuilder<DB, TableName, TableName, object>,
    RE extends ReferenceExpression<DB, TableName>
  >(
    filter: QueryFilter<DB, TableName, QB, RE>,
    obj: UpdateObject<DB, TableName>,
    returning: ["*"]
  ): Promise<Selectable<DB[TableName]>[]>;

  async updateByMatch<
    QB extends UpdateQueryBuilder<DB, TableName, TableName, object>,
    RE extends ReferenceExpression<DB, TableName>,
    R extends keyof Selectable<DB[TableName]> & string
  >(
    filter: QueryFilter<DB, TableName, QB, RE>,
    obj: UpdateObject<DB, TableName>,
    returning?: R[] | ["*"]
  ): Promise<
    Selectable<DB[TableName]>[] | Pick<Selectable<DB[TableName]>, R>[] | number
  > {
    let qb = this.updateRows().set(obj as any);
    qb = applyQueryFilter(this, filter)(qb as any) as any;
    if (returning) {
      // Cast here because TS wasn't allowing the check.
      if ((returning as string[]).includes("*")) {
        const result = await qb.returningAll().execute();
        return result as Selectable<DB[TableName]>[];
      }
      if (returning.length > 0) {
        const result = await qb.returning(returning as any).execute();
        return result as Pick<Selectable<DB[TableName]>, R>[];
      }
      await qb.execute();
      return [];
    }
    const result = await qb.executeTakeFirstOrThrow();
    return Number(result.numUpdatedRows);
  }
}
