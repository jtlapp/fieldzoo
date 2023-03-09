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
  ReturnColumns extends
    | (keyof Selectable<DB[TableName]> & string)[]
    | ["*"] = [],
  ReturnedType = ReturnColumns extends []
    ? void
    : ReturnColumns extends ["*"]
    ? Selectable<DB[TableName]>
    : ObjectWithKeys<Selectable<DB[TableName]>, ReturnColumns>
> extends KyselyFacet<
  DB,
  TableName,
  SelectedType,
  InsertedType,
  UpdatedType,
  ReturnColumns,
  ReturnedType
> {
  /**
   * Columns to return from table upon insertion. Contrary to the meaning of
   * `ReturnColumns`, an empty array here returns all columns, while null
   * returns none. `ReturnColumns` is more intuitive using `["*"]` and
   * `[]`, respectively, while the approach here requires fewer clock cycles.
   */
  protected returnColumns: (keyof Selectable<DB[TableName]> & string)[] | null;

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
      ReturnColumns,
      ReturnedType
    >
  ) {
    super(db, tableName, options);

    if (options?.insertReturnTransform) {
      if (!options.returnColumns) {
        throw Error("'insertReturnTransform' requires 'returnColumns'");
      }
      if (options?.returnColumns?.length === 0) {
        throw Error("No 'returnColumns' returned for 'insertReturnTransform'");
      }
    }
    this.returnColumns = null;
    if (options?.returnColumns) {
      // Cast here because TS wasn't allowing the includes() check.
      const returnColumns = options.returnColumns as string[];
      if (returnColumns.length > 0) {
        this.returnColumns = returnColumns.includes("*")
          ? []
          : (returnColumns as (keyof Selectable<DB[TableName]> & string)[]);
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
   * inserted rows when configured with `returnColumns`.
   * @param objs The objects to insert as rows.
   * @returns If `returnColumns` was configured in the options, returns
   *  an array of `ReturnedType` objects, one for each inserted row,
   *  defaulting to the returned columns. Otherwise, returns nothing.
   */
  async insertMany(
    objs: InsertedType[]
  ): Promise<ReturnColumns extends [] ? void : ReturnedType[]> {
    const transformedObjs = this.transformInsertion(objs);
    const qb = this.insertRows().values(transformedObjs);
    let output: ReturnedType[] | undefined;

    if (this.returnColumns === null) {
      await qb.execute();
    } else if (this.returnColumns.length == 0) {
      const returns = await qb.returningAll().execute();
      output = this.transformInsertReturn(objs, returns);
    } else {
      const returns = await qb.returning(this.returnColumns).execute();
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
   *  `ReturnedType`. Useful for getting auto-generated columns.
   * @returns An object containing the requested return columns, if any.
   *  Returns an `ReturnedType` when `returning` is omitted.
   */
  async insertOne(
    obj: InsertedType
  ): Promise<ReturnColumns extends [] ? void : ReturnedType> {
    const transformedObj = this.transformInsertion(obj);
    const qb = this.insertRows().values(transformedObj);
    let output: ReturnedType | undefined;

    if (this.returnColumns === null) {
      await qb.execute();
    } else if (this.returnColumns.length == 0) {
      const returns = await qb.returningAll().executeTakeFirst();
      if (returns === undefined) {
        throw Error("No row returned from insert returning all columns");
      }
      output = this.transformInsertReturn(obj, returns);
    } else {
      const returns = await qb.returning(this.returnColumns).executeTakeFirst();
      if (returns === undefined) {
        throw Error("No row returned from insert returning some columns");
      }
      output = this.transformInsertReturn(
        obj,
        returns as Partial<Selectable<DB[TableName]>>
      );
    }
    return output as any;
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
   * Updates rows in this table matching the provided filter, returning
   * columns from the updated rows when configured with `returnColumns`.
   * @param filter Filter specifying the rows to update.
   * @param obj The object whose field values are to be assigned to the row.
   * @returns If `returnColumns` was configured in the options, returns an
   *  array of `ReturnedType` objects, one for each updated row,
   *  defaulting to the returned columns. Otherwise, returns a count of the
   *  number of rows updated.
   */
  async update<
    QB extends UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>,
    RE extends ReferenceExpression<DB, TableName>
  >(
    filter: QueryFilter<DB, TableName, QB, RE>,
    obj: UpdatedType
  ): Promise<ReturnedType extends void ? number : ReturnedType[]> {
    const transformedObj = this.transformUpdate(obj);
    const uqb = this.updateRows().set(transformedObj as any);
    const fqb = applyQueryFilter(this, filter)(uqb as any);
    let output: ReturnedType[] | number | undefined;

    if (this.returnColumns === null) {
      const result = await fqb.executeTakeFirst();
      output = Number(result.numUpdatedRows);
    } else if (this.returnColumns.length == 0) {
      const result = await fqb.returningAll().execute();
      output = this.transformUpdateReturn(obj, result);
    } else {
      const result = await fqb.returning(this.returnColumns).execute();
      output = this.transformUpdateReturn(
        obj,
        result as Partial<Selectable<DB[TableName]>>[]
      );
    }
    return output as any;
  }
}
