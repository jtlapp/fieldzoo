import {
  Kysely,
  Insertable,
  Expression,
  ReferenceExpression,
  ComparisonOperatorExpression,
  OperandValueExpressionOrList,
  Selectable,
} from "kysely";
import { SelectAllQueryBuilder } from "kysely/dist/cjs/parser/select-parser";
import { SingleResultType } from "kysely/dist/cjs/util/type-utils";

interface TakeFirstBuilder<O> {
  executeTakeFirst(): Promise<SingleResultType<O>>;
}
interface TakeManyBuilder<O> {
  execute(): Promise<O[]>;
}

export class KyselyTable<DB, TableName extends keyof DB & string> {
  constructor(readonly db: Kysely<DB>, readonly tableName: TableName) {}

  /**
   * Creates a query builder for inserting rows into this table.
   * @returns A query builder for inserting rows into this table.
   */
  insertRows() {
    return this.db.insertInto(this.tableName);
  }

  /**
   * Creates a query builder for updating rows in this table.
   * @returns A query builder for updating rows in this table.
   */
  updateRows() {
    return this.db.updateTable(this.tableName);
  }

  /**
   * Creates a query builder for selecting rows from this table.
   * @returns A query builder for selecting rows from this table.
   */
  selectRows() {
    return this.db.selectFrom(this.tableName).selectAll();
  }

  /**
   * Creates a query builder for deleting rows from this table.
   * @returns A query builder for deleting rows from this table.
   */
  deleteRows() {
    return this.db.deleteFrom(this.tableName);
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
   * @throws `NoResultError` if returning columns were requested but none
   *    were returned.
   */
  insertOne(obj: Insertable<DB[TableName]>): Promise<void>;
  insertOne<O extends Selectable<DB[TableName]>, F extends keyof O>(
    obj: Insertable<DB[TableName]>,
    returning: F[]
  ): Promise<Pick<O, F>>;
  insertOne<O extends Selectable<DB[TableName]>>(
    obj: Insertable<DB[TableName]>,
    returning: ["*"]
  ): Promise<Selectable<DB[TableName]>>;
  async insertOne<
    O extends Selectable<DB[TableName]>,
    F extends keyof O & keyof DB[TableName] & string
  >(
    obj: Insertable<DB[TableName]>,
    returning?: F[] | ["*"]
  ): Promise<Selectable<DB[TableName]> | Pick<O, F> | void> {
    const qb = this.db.insertInto(this.tableName).values(obj);
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
        return result as Pick<O, F>;
      }
      await qb.execute();
      return {} as Pick<O, F>;
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
  insertMany<O extends Selectable<DB[TableName]>, F extends keyof O>(
    objs: Insertable<DB[TableName]>[],
    returning: F[]
  ): Promise<Pick<O, F>[]>;
  insertMany<O extends Selectable<DB[TableName]>>(
    objs: Insertable<DB[TableName]>[],
    returning: ["*"]
  ): Promise<Selectable<DB[TableName]>[]>;
  async insertMany<
    O extends Selectable<DB[TableName]>,
    F extends keyof O & keyof DB[TableName] & string
  >(
    objs: Insertable<DB[TableName]>[],
    returning?: F[] | ["*"]
  ): Promise<Selectable<DB[TableName]>[] | Pick<O, F>[] | void> {
    const qb = this.db.insertInto(this.tableName).values(objs);
    if (returning) {
      // Cast here because TS wasn't allowing the check.
      if ((returning as string[]).includes("*")) {
        const result = await qb.returningAll().execute();
        return result as Selectable<DB[TableName]>[];
      }
      if (returning.length > 0) {
        const result = await qb.returning(returning as any).execute();
        return result as Pick<O, F>[];
      }
      await qb.execute();
      return objs.map((_) => ({})) as Pick<O, F>[];
    }
    await qb.execute();
  }

  /**
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
  selectMany<RE extends ReferenceExpression<DB, TableName>>(
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: OperandValueExpressionOrList<DB, TableName, RE>
  ): Promise<Selectable<DB[TableName]>[]>;
  selectMany<
    QB extends TakeManyBuilder<Selectable<DB[TableName]>>,
    S extends keyof DB
  >(
    callback: (
      qb: ReturnType<
        SelectAllQueryBuilder<DB, TableName, object, S>["selectAll"]
      >
    ) => QB
  ): Promise<Selectable<DB[TableName]>[]>;
  selectMany(expression: Expression<any>): Promise<Selectable<DB[TableName]>[]>;
  async selectMany(...args: [any?, any?, any?]): Promise<any> {
    let qb = this.db.selectFrom(this.tableName).selectAll();
    if (args.length > 0) {
      if (typeof args[0] == "function") {
        qb = args[0](qb);
      } else {
        qb = qb.where(...args);
      }
    }
    return qb.execute();
  }

  /**
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
  selectOne<RE extends ReferenceExpression<DB, TableName>>(
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: OperandValueExpressionOrList<DB, TableName, RE>
  ): Promise<Selectable<DB[TableName]> | null>;
  selectOne<
    QB extends TakeFirstBuilder<Selectable<DB[TableName]>>,
    S extends keyof DB
  >(
    callback: (
      qb: ReturnType<
        SelectAllQueryBuilder<DB, TableName, object, S>["selectAll"]
      >
    ) => QB
  ): Promise<Selectable<DB[TableName]> | null>;
  selectOne(
    expression: Expression<any>
  ): Promise<Selectable<DB[TableName]> | null>;
  async selectOne(...args: [any?, any?, any?]): Promise<any> {
    let qb = this.db.selectFrom(this.tableName).selectAll();
    if (args.length > 0) {
      if (typeof args[0] == "function") {
        qb = args[0](qb);
      } else {
        qb = qb.where(...args);
      }
    }
    return (await qb.executeTakeFirst()) || null;
  }
}
