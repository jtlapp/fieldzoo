import {
  Kysely,
  Insertable,
  ReferenceExpression,
  Selectable,
  UpdateQueryBuilder,
  UpdateResult,
} from "kysely";
import { SelectAllQueryBuilder } from "kysely/dist/cjs/parser/select-parser";

import { FacetOptions } from "./FacetOptions";
import { KyselyFacet } from "./KyselyFacet";
import { QueryFilter, applyQueryFilter } from "../filters/QueryFilter";
import { ObjectWithKeys } from "../lib/type-utils";

// TODO: Configure type of returned counts (e.g. number vs bigint)

export class StandardFacet<
  DB,
  TableName extends keyof DB & string,
  SelectedType = Selectable<DB[TableName]>,
  InsertedType = Insertable<DB[TableName]>,
  UpdatedType = Partial<InsertedType>,
  InsertReturnColumns extends
    | (keyof Selectable<DB[TableName]> & string)[]
    | ["*"] = [],
  InsertReturnedType = InsertReturnColumns extends []
    ? void
    : InsertReturnColumns extends ["*"]
    ? Selectable<DB[TableName]>
    : ObjectWithKeys<Selectable<DB[TableName]>, InsertReturnColumns>,
  UpdateReturnedType = void
> extends KyselyFacet<
  DB,
  TableName,
  SelectedType,
  InsertedType,
  UpdatedType,
  InsertReturnColumns,
  InsertReturnedType,
  UpdateReturnedType
> {
  /**
   * Columns to return from table upon insertion. Contrary to the meaning of
   * `InsertReturnColumns`, an empty array here returns all columns, while null
   * returns none. `InsertReturnColumns` is more intuitive using `["*"]` and
   * `[]`, respectively, while the approach here requires fewer clock cycles.
   */
  protected insertReturnColumns:
    | (keyof Selectable<DB[TableName]> & string)[]
    | null;

  /**
   * Constructs a new Kysely table.
   * @param db The Kysely database.
   * @param tableName The name of the table.
   */
  constructor(
    db: Kysely<DB>,
    tableName: TableName,
    options?: FacetOptions<
      DB,
      TableName,
      SelectedType,
      InsertedType,
      UpdatedType,
      InsertReturnColumns,
      InsertReturnedType,
      UpdateReturnedType
    >
  ) {
    super(db, tableName, options);

    if (options?.insertReturnTransform) {
      if (!options.insertReturnColumns) {
        throw Error("'insertReturnTransform' requires 'insertReturnColumns'");
      }
      if (options?.insertReturnColumns?.length === 0) {
        throw Error(
          "No 'insertReturnColumns' returned for 'insertReturnTransform'"
        );
      }
    }
    this.insertReturnColumns = null;
    if (options?.insertReturnColumns) {
      // Cast here because TS wasn't allowing the includes() check.
      const insertReturnColumns = options.insertReturnColumns as string[];
      if (insertReturnColumns.length > 0) {
        this.insertReturnColumns = insertReturnColumns.includes("*")
          ? []
          : (insertReturnColumns as (keyof Selectable<DB[TableName]> &
              string)[]);
      }
    }

    if (options?.updateReturnTransform) {
      if (!options.defaultUpdateReturns) {
        throw Error("'updateReturnTransform' requires 'defaultUpdateReturns'");
      }
      if (options?.defaultUpdateReturns?.length === 0) {
        throw Error("'defaultUpdateReturns' cannot be an empty array");
      }
    } else if (options?.defaultUpdateReturns) {
      throw Error("'defaultUpdateReturns' requires 'updateReturnTransform'");
    }
  }

  // TODO: consider combining insertOne() and insertMany()
  /**
   * Inserts multiple rows into this table, returning columns from the
   * inserted rows when configured with `insertReturnColumns`.
   * @param objs The objects to insert as rows.
   * @returns An array of `InsertReturnedType` objects, one for each
   *  inserted row, if `insertReturnColumns` was configured in the
   *  options. Otherwise, returns nothing.
   */
  async insertMany(
    objs: InsertedType[]
  ): Promise<InsertReturnColumns extends [] ? void : InsertReturnedType[]> {
    const transformedObjs = this.transformInsertion(objs);
    const qb = this.insertRows().values(transformedObjs);
    let output: InsertReturnedType[] | undefined;

    if (this.insertReturnColumns === null) {
      await qb.execute();
    } else if (this.insertReturnColumns.length == 0) {
      const returns = await qb.returningAll().execute();
      output = this.transformInsertReturn(objs, returns);
    } else {
      const returns = await qb.returning(this.insertReturnColumns).execute();
      output = this.transformInsertReturn(
        objs,
        returns as Partial<Selectable<DB[TableName]>>[]
      );
    }
    return output as any;
  }

  /**
   * Inserts a single row into this table, optionally returning columns
   * from the inserted row.
   * @param obj The object to insert as a row.
   * @param returning The columns to return from the inserted row. If
   *  `["*"]` is given, all columns are returned. If a list of field names
   *  is given, returns only those field names. If omitted, returns type
   *  `UpdateReturnedType`. Useful for getting auto-generated columns.
   * @returns An object containing the requested return columns, if any.
   *  Returns an `UpdateReturnedType` when `returning` is omitted.
   */
  insertOne(
    obj: InsertedType
  ): Promise<InsertReturnedType extends void ? void : InsertReturnedType>;

  insertOne<O extends Selectable<DB[TableName]>, R extends keyof O>(
    obj: InsertedType,
    returning: R[]
  ): Promise<Pick<O, R>>;

  insertOne<O extends Selectable<DB[TableName]>>(
    obj: InsertedType,
    returning: ["*"]
  ): Promise<Selectable<DB[TableName]>>;

  async insertOne<
    O extends Selectable<DB[TableName]>,
    R extends keyof O & keyof DB[TableName] & string
  >(
    obj: InsertedType,
    returning?: R[] | ["*"]
  ): Promise<
    InsertReturnedType | Selectable<DB[TableName]> | Pick<O, R> | void
  > {
    const transformedObj = this.transformInsertion(obj);
    const qb = this.insertRows().values(transformedObj);

    // Return columns requested via `returning` parameter.

    if (returning) {
      if (returning.length === 0) {
        throw Error("'returning' cannot be an empty array");
      }
      // Cast here because TS wasn't allowing the check.
      if ((returning as string[]).includes("*")) {
        const result = await qb.returningAll().executeTakeFirstOrThrow();
        return result as Selectable<DB[TableName]>;
      }
      const result = await qb
        .returning(returning as any)
        .executeTakeFirstOrThrow();
      return result as Pick<O, R>;
    }

    // Return columns requested via `insertReturnColumns` option.

    const insertReturnColumns = this.options?.insertReturnColumns;
    if (insertReturnColumns) {
      const returns = await qb.returning(insertReturnColumns as any).execute();
      return this.transformInsertReturn(obj, returns[0] as any);
    }

    // No return columns requested when no `insertReturnColumns` option.

    await qb.execute();
  }

  // TODO: consider combining selectMany() and selectOne() into select().
  /**
   * Selects zero or more rows from this table, selecting rows according
   * to the provided filter.
   * @param filter Filter that constrains the selected rows.
   * @returns An array of objects containing the selected rows, possibly empty.
   */
  async selectMany<
    QB extends SelectAllQueryBuilder<DB, TableName, object, TableName>,
    RE extends ReferenceExpression<DB, TableName>
  >(filter: QueryFilter<DB, TableName, QB, RE>): Promise<SelectedType[]> {
    const sqb = this.selectRows().selectAll();
    const fqb = applyQueryFilter(this, filter)(sqb as any);
    const selections = await fqb.execute();
    return this.transformSelection(selections as Selectable<DB[TableName]>[]);
  }

  /**
   * Selects at most one row from this table, selecting rows according
   * to the provided filter.
   * @param filter Filter that constrains the selection.
   * @returns An object containing the selected row, or `null` if no row
   *    was selected.
   */
  async selectOne<
    QB extends SelectAllQueryBuilder<DB, TableName, object, TableName>,
    RE extends ReferenceExpression<DB, TableName>
  >(filter: QueryFilter<DB, TableName, QB, RE>): Promise<SelectedType | null> {
    const sqb = this.selectRows().selectAll();
    const fqb = applyQueryFilter(this, filter)(sqb as any);
    const selection = await fqb.executeTakeFirst();
    if (!selection) return null;
    return this.transformSelection(selection as Selectable<DB[TableName]>);
  }

  /**
   * Updates rows in this table matching the provided filter,
   * optionally returning columns from the updated rows.
   * @param filter Filter specifying the rows to update.
   * @param obj The object whose field values are to be assigned to the row.
   * @param returning The columns to return from the updated row. If
   *    `["*"]` is given, all columns are returned. If a list of field names
   *    is given, returns only those field names. If `[]` is given, returns
   *    the number of rows updated. If omitted, an `UpdateReturnedType` is
   *    returned. Useful for getting auto-generated columns.
   * @returns If a non-empty `returning` was provided, returns an array of
   *    objects having the requested return column values. If an empty
   *    `returning` was provided, returns the number of rows updated.
   *    Returns an `UpdateReturnedType` if `returning` was omitted.
   */
  update<
    QB extends UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>,
    RE extends ReferenceExpression<DB, TableName>
  >(
    filter: QueryFilter<DB, TableName, QB, RE>,
    obj: UpdatedType
  ): Promise<UpdateReturnedType extends void ? void : UpdateReturnedType[]>;

  update<
    QB extends UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>,
    RE extends ReferenceExpression<DB, TableName>
  >(
    filter: QueryFilter<DB, TableName, QB, RE>,
    obj: UpdatedType,
    returning: []
  ): Promise<number>;

  update<
    QB extends UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>,
    RE extends ReferenceExpression<DB, TableName>,
    R extends keyof Selectable<DB[TableName]> & string
  >(
    filter: QueryFilter<DB, TableName, QB, RE>,
    obj: UpdatedType,
    returning: R[]
  ): Promise<Pick<Selectable<DB[TableName]>, R>[]>;

  update<
    QB extends UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>,
    RE extends ReferenceExpression<DB, TableName>
  >(
    filter: QueryFilter<DB, TableName, QB, RE>,
    obj: UpdatedType,
    returning: ["*"]
  ): Promise<Selectable<DB[TableName]>[]>;

  async update<
    QB extends UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>,
    RE extends ReferenceExpression<DB, TableName>,
    R extends keyof Selectable<DB[TableName]> & string
  >(
    filter: QueryFilter<DB, TableName, QB, RE>,
    obj: UpdatedType,
    returning?: [] | R[] | ["*"]
  ): Promise<
    | UpdateReturnedType[]
    | Selectable<DB[TableName]>[]
    | Pick<Selectable<DB[TableName]>, R>[]
    | number
    | void
  > {
    const transformedObj = this.transformUpdate(obj);
    const uqb = this.updateRows().set(transformedObj as any);
    const fqb = applyQueryFilter(this, filter)(uqb as any);

    // Return columns requested via `returning` parameter.

    if (returning) {
      if (returning.length === 0) {
        const result = await fqb.executeTakeFirstOrThrow();
        return Number(result.numUpdatedRows);
      }
      // Cast here because TS wasn't allowing the check.
      if ((returning as string[]).includes("*")) {
        const result = await fqb.returningAll().execute();
        return result as Selectable<DB[TableName]>[];
      }
      const result = await fqb.returning(returning as any).execute();
      return result as Pick<Selectable<DB[TableName]>, R>[];
    }

    // Return columns requested via `defaultUpdateReturns` option.

    const defaultUpdateReturns = this.options?.defaultUpdateReturns;
    if (defaultUpdateReturns) {
      const returns = await fqb
        .returning(defaultUpdateReturns as any)
        .execute();
      return this.transformUpdateReturn(obj, returns as any);
    }

    // No return columns requested when no `defaultUpdateReturns` option.

    await fqb.execute();
  }
}
