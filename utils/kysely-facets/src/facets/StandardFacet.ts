import {
  Kysely,
  Insertable,
  ReferenceExpression,
  Selectable,
  UpdateQueryBuilder,
  UpdateResult,
  Updateable,
} from "kysely";

import { FacetOptions } from "./FacetOptions";
import { KyselyFacet } from "./KyselyFacet";
import { QueryFilter, applyQueryFilter } from "../filters/QueryFilter";
import { ObjectWithKeys } from "../lib/type-utils";

// TODO: Configure type of returned counts (e.g. number vs bigint)

export class StandardFacet<
  DB,
  TableName extends keyof DB & string,
  SelectedObject = Selectable<DB[TableName]>,
  InsertedObject = Insertable<DB[TableName]>,
  UpdaterObject = Partial<Insertable<DB[TableName]>>,
  ReturnColumns extends
    | (keyof Selectable<DB[TableName]> & string)[]
    | ["*"] = [],
  ReturnedObject = ReturnColumns extends []
    ? void
    : ObjectWithKeys<Selectable<DB[TableName]>, ReturnColumns>
> extends KyselyFacet<DB, TableName, SelectedObject> {
  /**
   * Options governing facet behavior.
   */
  protected options?: FacetOptions<
    DB,
    TableName,
    SelectedObject,
    InsertedObject,
    UpdaterObject,
    ReturnColumns,
    ReturnedObject
  >;

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
      SelectedObject,
      InsertedObject,
      UpdaterObject,
      ReturnColumns,
      ReturnedObject
    >
  ) {
    super(db, tableName, options?.selectTransform);
    this.options = options;

    if (options?.insertReturnTransform) {
      if (!options.returnColumns) {
        throw Error("'insertReturnTransform' requires 'returnColumns'");
      }
      if (options?.returnColumns?.length === 0) {
        throw Error("No 'returnColumns' returned for 'insertReturnTransform'");
      }
    }
    if (options?.updateReturnTransform) {
      if (!options.returnColumns) {
        throw Error("'updateReturnTransform' requires 'returnColumns'");
      }
      if (options?.returnColumns?.length === 0) {
        throw Error("No 'returnColumns' returned for 'updateReturnTransform'");
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
  }

  /**
   * Inserts one or more rows into this table, optionally returning a
   * pre-configured set of columns from the inserted row or rows.
   * @param objOrObjs The object or objects to insert as a row.
   * @returns If `returnColumns` was configured in the options, returns
   *  a single `ReturnedObject` when `objOrObjs` is not an array, and
   *  returns an array of them otherwise, one for each inserted row.
   *  Returns nothing if `returnColumns` was not provided.
   */
  insert(
    obj: InsertedObject
  ): Promise<ReturnColumns extends [] ? void : ReturnedObject>;

  insert(
    objs: InsertedObject[]
  ): Promise<ReturnColumns extends [] ? void : ReturnedObject[]>;

  async insert(
    objOrObjs: InsertedObject | InsertedObject[]
  ): Promise<
    ReturnColumns extends [] ? void : ReturnedObject | ReturnedObject[]
  > {
    const transformedObjOrObjs = this.transformInsertion(objOrObjs as any);
    const qb = this.insertRows().values(transformedObjOrObjs);

    if (this.returnColumns === null) {
      await qb.execute();
      return undefined as any;
    }
    const returns =
      this.returnColumns.length == 0
        ? await qb.returningAll().execute()
        : await qb.returning(this.returnColumns).execute();
    if (returns === undefined) {
      throw Error("No row returned from insert expecting returned columns");
    }
    // TODO: revisit these casts
    return this.transformInsertReturn(
      objOrObjs as any,
      (Array.isArray(objOrObjs) ? returns : returns[0]) as any
    ) as any;
  }

  /**
   * Updates rows in this table matching the provided filter, returning
   * columns from the updated rows when configured with `returnColumns`.
   * @param filter Filter specifying the rows to update.
   * @param obj The object whose field values are to be assigned to the row.
   * @returns If `returnColumns` was configured in the options, returns an
   *  array of `ReturnedObject` objects, one for each updated row.
   *  Otherwise, returns a count of the number of rows updated.
   */
  async update<
    QB extends UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>,
    RE extends ReferenceExpression<DB, TableName>
  >(
    filter: QueryFilter<DB, TableName, QB, RE>,
    obj: UpdaterObject
  ): Promise<ReturnedObject extends void ? number : ReturnedObject[]> {
    const transformedObj = this.transformUpdater(obj);
    const uqb = this.updateRows().set(transformedObj as any);
    const fqb = applyQueryFilter(this, filter)(uqb as any);
    let output: ReturnedObject[] | number | undefined;

    if (this.returnColumns === null) {
      const result = await fqb.executeTakeFirst();
      output = Number(result.numUpdatedRows);
    } else if (this.returnColumns.length == 0) {
      const result = await fqb.returningAll().execute();
      // @ts-ignore - TODO: resolve this
      output = this.transformUpdateReturn(obj, result);
    } else {
      const result = await fqb.returning(this.returnColumns).execute();
      // @ts-ignore - TODO: resolve this
      output = this.transformUpdateReturn(obj, result);
    }
    return output as any;
  }

  /**
   * Transforms an object or array of objects received for insertion into
   * an insertable row or array of rows.
   */
  protected transformInsertion(
    source: InsertedObject
  ): Insertable<DB[TableName]>;
  protected transformInsertion(
    source: InsertedObject[]
  ): Insertable<DB[TableName]>[];
  protected transformInsertion(
    source: InsertedObject | InsertedObject[]
  ): Insertable<DB[TableName]> | Insertable<DB[TableName]>[] {
    if (this.options?.insertTransform) {
      if (Array.isArray(source)) {
        // TS isn't seeing that options and the transform are defined.
        return source.map((obj) => this.options!.insertTransform!(obj));
      }
      return this.options.insertTransform(source);
    }
    return source as any;
  }

  /**
   * Transforms an object or an array of objects returned from an insert
   * into a returnable object or an array of objects.
   */
  protected transformInsertReturn(
    source: InsertedObject,
    returns: ObjectWithKeys<Selectable<DB[TableName]>, ReturnColumns>
  ): ReturnedObject;
  protected transformInsertReturn(
    source: InsertedObject[],
    returns: ObjectWithKeys<Selectable<DB[TableName]>, ReturnColumns>[]
  ): ReturnedObject[];
  protected transformInsertReturn(
    source: InsertedObject | InsertedObject[],
    returns:
      | ObjectWithKeys<Selectable<DB[TableName]>, ReturnColumns>
      | ObjectWithKeys<Selectable<DB[TableName]>, ReturnColumns>[]
  ): ReturnedObject | ReturnedObject[] {
    if (this.options?.insertReturnTransform) {
      if (Array.isArray(source)) {
        if (!Array.isArray(returns)) {
          throw Error("Expected returns to be an array");
        }
        // TS isn't seeing that options and the transform are defined.
        return source.map((obj, i) =>
          this.options!.insertReturnTransform!(obj, returns[i])
        );
      }
      if (Array.isArray(returns)) {
        throw Error("Expected returns to be a single object");
      }
      return this.options.insertReturnTransform(source, returns);
    }
    return returns as any;
  }

  /**
   * Transforms an object or array of objects received for update into
   * an updateable row or array of rows.
   */
  // TODO: Might not need to support arrays here.
  protected transformUpdater(source: UpdaterObject): Updateable<DB[TableName]>;
  protected transformUpdater(
    source: UpdaterObject[]
  ): Updateable<DB[TableName]>[];
  protected transformUpdater(
    source: UpdaterObject | UpdaterObject[]
  ): Updateable<DB[TableName]> | Updateable<DB[TableName]>[] {
    if (this.options?.updateTransform) {
      if (Array.isArray(source)) {
        // TS isn't seeing that options and the transform are defined.
        return source.map((obj) => this.options!.updateTransform!(obj));
      }
      return this.options.updateTransform(source);
    }
    return source as any;
  }

  /**
   * Transforms an object or an array of objects returned from an update
   * into a returnable object or an array of objects.
   */
  protected transformUpdateReturn(
    source: UpdaterObject,
    returns: ObjectWithKeys<Selectable<DB[TableName]>, ReturnColumns>[]
  ): ReturnedObject[] {
    if (this.options?.updateReturnTransform) {
      // TS isn't seeing that options and the transform are defined.
      return returns.map((returnValues) =>
        this.options!.updateReturnTransform!(source, returnValues)
      );
    }
    return returns as any;
  }
}
