import {
  Kysely,
  Insertable,
  ReferenceExpression,
  Selectable,
  Updateable,
  InsertQueryBuilder,
  InsertResult,
} from "kysely";

import { LensOptions, QueryLens } from "./QueryLens";
import { QueryFilter, applyQueryFilter } from "../filters/QueryFilter";
import { EmptyObject, ObjectWithKeys } from "../lib/type-utils";

// TODO: don't store options in lens, instead extracting needed
//  values; otherwise I'd have to store a separate copy of each kind of
//  options object for access without stepping on one another.
// TODO: Configure type of returned counts (e.g. number vs bigint)

type DeleteQB<DB, TableName extends keyof DB & string> = ReturnType<
  TableLens<DB, TableName, any>["deleteQB"]
>;
type UpdateQB<DB, TableName extends keyof DB & string> = ReturnType<
  TableLens<DB, TableName, any>["updateQB"]
>;

/**
 * Options governing TableLens behavior.
 * @typeparam DB Interface whose fields are table names defining tables.
 * @typeparam TableName Name of the table.
 * @typeparam SelectedObject Type of objects returned by select queries.
 * @typeparam InsertedObject Type of objects inserted into the table.
 * @typeparam UpdaterObject Type of objects used to update rows of the table.
 * @typeparam ReturnColumns Columns to return from the table on insert or
 *  update, except when explicitly requesting no columns. `["*"]` returns
 *  all columns; `[]` returns none and is the default.
 * @typeparam ReturnedObject Objects to return from inserts and updates.
 */
export interface TableLensOptions<
  DB,
  TableName extends keyof DB & string,
  SelectedObject,
  InsertedObject,
  UpdaterObject,
  ReturnColumns extends (keyof Selectable<DB[TableName]> & string)[] | ["*"],
  ReturnedObject
> extends LensOptions<DB, TableName, EmptyObject, [], SelectedObject> {
  /** Transformation to apply to inserted objects before insertion. */
  readonly insertTransform?: (obj: InsertedObject) => Insertable<DB[TableName]>;

  /** Transformation to apply to objects provided for updating values. */
  readonly updaterTransform?: (
    update: UpdaterObject
  ) => Updateable<DB[TableName]>;

  /**
   * Columns to return from the table on insert or update, unless explicitly
   * requesting no columns. `["*"]` returns all columns; `[]` returns none.
   */
  readonly returnColumns?: ReturnColumns;

  /** Transformation to apply to column values returned from inserts. */
  readonly insertReturnTransform?: (
    source: InsertedObject,
    returns: ObjectWithKeys<Selectable<DB[TableName]>, ReturnColumns>
  ) => ReturnedObject;

  /** Transformation to apply to column values returned from updates. */
  readonly updateReturnTransform?: (
    source: UpdaterObject,
    returns: ObjectWithKeys<Selectable<DB[TableName]>, ReturnColumns>
  ) => ReturnedObject;
}

/**
 * A lens providing access to a single table.
 * @typeparam DB Interface whose fields are table names defining tables.
 * @typeparam TableName Name of the table.
 * @typeparam SelectedObject Type of objects returned by select queries.
 * @typeparam InsertedObject Type of objects inserted into the table.
 * @typeparam UpdaterObject Type of objects used to update rows of the table.
 * @typeparam ReturnColumns Columns to return from the table on insert or
 *  update, except when explicitly requesting no columns. `["*"]` returns
 *  all columns; `[]` returns none and is the default.
 * @typeparam ReturnedObject Objects to return from inserts and updates.
 */
export class TableLens<
  DB,
  TableName extends keyof DB & string,
  SelectedObject = Selectable<DB[TableName]>,
  InsertedObject = Insertable<DB[TableName]>,
  UpdaterObject = Partial<Insertable<DB[TableName]>>,
  ReturnColumns extends
    | (keyof Selectable<DB[TableName]> & string)[]
    | ["*"] = [],
  ReturnedObject = ReturnColumns extends ["*"]
    ? Selectable<DB[TableName]>
    : ObjectWithKeys<Selectable<DB[TableName]>, ReturnColumns>
> extends QueryLens<DB, TableName, EmptyObject, [], SelectedObject> {
  /** Columns to return from the table on insert or update. */
  protected returnColumns: (keyof Selectable<DB[TableName]> & string)[] | ["*"];

  /**
   * Constructs a new table lens.
   * @param db The Kysely database.
   * @param tableName The name of the table.
   * @param options Options governing lens behavior. `returnColumns`
   *  defaults to returning no columns.
   */
  constructor(
    db: Kysely<DB>,
    readonly tableName: TableName,
    readonly options: TableLensOptions<
      DB,
      TableName,
      SelectedObject,
      InsertedObject,
      UpdaterObject,
      ReturnColumns,
      ReturnedObject
    > = {}
  ) {
    // TODO: revisit this cast
    super(db, db.selectFrom(tableName) as any, options);
    this.returnColumns = options.returnColumns ?? [];

    if (options.insertTransform) {
      this.transformInsertion = options.insertTransform;
    }
    if (options.updaterTransform) {
      this.transformUpdater = options.updaterTransform;
    }
    if (options.insertReturnTransform) {
      this.transformInsertReturn = options.insertReturnTransform;
    }
  }

  /**
   * Creates a query builder for deleting rows from this table.
   * @returns A query builder for deleting rows from this table.
   */
  deleteQB() {
    return this.db.deleteFrom(this.tableName);
  }

  /**
   * Deletes rows matching the provided filter from this table.
   * @param filter Filter specifying the rows to delete.
   * @returns Returns the number of deleted rows.
   */
  async delete<RE extends ReferenceExpression<DB, TableName>>(
    filter: QueryFilter<DB, TableName, DeleteQB<DB, TableName>, RE>
  ): Promise<number> {
    const qb = applyQueryFilter(this, filter)(this.deleteQB());
    const result = await qb.executeTakeFirst();
    return Number(result.numDeletedRows);
  }

  /**
   * Creates a query builder for inserting rows into this table.
   * @returns A query builder for inserting rows into this table.
   */
  insertQB() {
    return this.db.insertInto(this.tableName);
  }

  /**
   * Inserts one or more rows into this table. For each row inserted,
   * retrieves the columns specified in the `returnColumns` option,
   * which are returned unless `insertReturnTransform` transforms them
   * into `ReturnedObject`. If `returnColumns` is empty, returns nothing.
   * @param objOrObjs The object or objects to insert as a row.
   * @returns Returns a `ReturnedObject` for each inserted object. Will
   *  be an array when `objOrObjs` is an array, will be a single object
   *  otherwise. Returns nothing (void) if `returnColumns` is empty.
   */
  insert(
    obj: InsertedObject
  ): Promise<ReturnColumns extends [] ? void : ReturnedObject>;

  insert(
    objs: InsertedObject[]
  ): Promise<ReturnColumns extends [] ? void : ReturnedObject[]>;

  async insert(
    objOrObjs: InsertedObject | InsertedObject[]
  ): Promise<ReturnedObject | ReturnedObject[] | void> {
    const insertedAnArray = Array.isArray(objOrObjs); // expensive operation
    let qb: InsertQueryBuilder<DB, TableName, InsertResult>;
    if (insertedAnArray) {
      const transformedObjs = this.transformInsertionArray(objOrObjs);
      // TS requires separate calls to values() for different argument types.
      qb = this.insertQB().values(transformedObjs);
    } else {
      const transformedObj = this.transformInsertion(objOrObjs);
      // TS requires separate calls to values() for different argument types.
      qb = this.insertQB().values(transformedObj);
    }

    if (this.returnColumns.length == 0) {
      await qb.execute();
      return;
    }

    // Assign `returns` all at once to capture its complex type. Can't place
    // this in a shared method because the types are not compatible.
    const returns =
      this.returnColumns[0] == "*"
        ? await qb.returningAll().execute()
        : // prettier-ignore
          await qb.returning(
            this.returnColumns as (keyof Selectable<DB[TableName]> & string)[]
          ).execute();
    if (returns === undefined) {
      throw Error("No rows returned from insert expecting returned columns");
    }
    if (insertedAnArray) {
      return this.transformInsertReturnArray(objOrObjs, returns as any);
    }
    return this.transformInsertReturn(objOrObjs, returns[0] as any);
  }

  /**
   * Inserts one or more rows into this table, without returning any columns.
   * @param objOrObjs The object or objects to insert as a row.
   */
  insertNoReturns(obj: InsertedObject): Promise<void>;

  insertNoReturns(objs: InsertedObject[]): Promise<void>;

  async insertNoReturns(
    objOrObjs: InsertedObject | InsertedObject[]
  ): Promise<void> {
    const transformedObjOrObjs = this.transformInsertion(objOrObjs as any);
    const qb = this.insertQB().values(transformedObjOrObjs);
    await qb.execute();
  }

  /**
   * Creates a query builder for updating rows in this table.
   * @returns A query builder for updating rows in this table.
   */
  updateQB() {
    return this.db.updateTable(this.tableName);
  }

  /**
   * Updates rows in this table matching the provided filter. For each row
   * updated, retrieves the columns specified in the `returnColumns` option,
   * which are returned unless `updateReturnTransform` transforms them
   * into `ReturnedObject`. If `returnColumns` is empty, returns nothing.
   * @param filter Filter specifying the rows to update.
   * @param obj The object whose field values are to be assigned to the row.
   * @returns Returns an array of `ReturnedObject` objects, one for each
   *  updated row, or nothing (void) if `returnColumns` is empty.
   */
  update<RE extends ReferenceExpression<DB, TableName>>(
    filter: QueryFilter<DB, TableName, UpdateQB<DB, TableName>, RE>,
    obj: UpdaterObject
  ): Promise<ReturnColumns extends [] ? void : ReturnedObject[]>;

  async update<RE extends ReferenceExpression<DB, TableName>>(
    filter: QueryFilter<DB, TableName, UpdateQB<DB, TableName>, RE>,
    obj: UpdaterObject
  ): Promise<ReturnedObject[] | void> {
    const transformedObj = this.transformUpdater(obj);
    const uqb = this.updateQB().set(transformedObj as any);
    const fqb = applyQueryFilter(this, filter)(uqb);

    if (this.returnColumns.length == 0) {
      await fqb.execute();
      return;
    }

    // Assign `returns` all at once to capture its complex type. Can't place
    // this in a shared method because the types are not compatible.
    const returns =
      this.returnColumns[0] == "*"
        ? await fqb.returningAll().execute()
        : await fqb.returning(this.returnColumns as any).execute();
    if (returns === undefined) {
      throw Error("No rows returned from update expecting returned columns");
    }
    return this.transformUpdateReturn(obj, returns as any) as any;
  }

  /**
   * Updates rows in this table matching the provided filter, returning
   * the number of updated rows.
   * @param filter Filter specifying the rows to update.
   * @param obj The object whose field values are to be assigned to the row.
   * @returns Returns the number of updated rows.
   */
  async updateGetCount<RE extends ReferenceExpression<DB, TableName>>(
    filter: QueryFilter<DB, TableName, UpdateQB<DB, TableName>, RE>,
    obj: UpdaterObject
  ): Promise<number> {
    const transformedObj = this.transformUpdater(obj);
    const uqb = this.updateQB().set(transformedObj as any);
    const fqb = applyQueryFilter(this, filter)(uqb);
    const result = await fqb.executeTakeFirst();
    return Number(result.numUpdatedRows);
  }

  /**
   * Transforms an object into a row for insertion.
   * @param obj The object to transform.
   * @returns Row representation of the object.
   */
  // This lengthy type provides better type assistance messages
  // in VSCode than a dedicated TransformInsertion type would.
  protected transformInsertion: NonNullable<
    TableLensOptions<
      DB,
      TableName,
      SelectedObject,
      InsertedObject,
      UpdaterObject,
      ReturnColumns,
      ReturnedObject
    >["insertTransform"]
  > = (obj) => obj as Insertable<DB[TableName]>;

  /**
   * Transforms an array of to-be-inserted objects into an insertable array
   * of rows. A utility for keeping transform code simple and performant.
   * @param source The array of inseted objects to transform.
   * @returns Array of rows representing the objects.
   */
  protected transformInsertionArray(
    source: InsertedObject[]
  ): Insertable<DB[TableName]>[] {
    if (this.options.insertTransform) {
      // TS isn't seeing that that transform is defined.
      return source.map((obj) => this.options.insertTransform!(obj));
    }
    return source as any;
  }

  /**
   * Transforms an object returned from an insert into an object to be
   * returned to the caller.
   * @param source The object that was inserted.
   * @param returns The object returned from the insert.
   * @returns The object to be returned to the caller.
   */
  // This lengthy type provides better type assistance messages
  // in VSCode than a dedicated TransformInsertion type would.
  protected transformInsertReturn: NonNullable<
    TableLensOptions<
      DB,
      TableName,
      SelectedObject,
      InsertedObject,
      UpdaterObject,
      ReturnColumns,
      ReturnedObject
    >["insertReturnTransform"]
  > = (_obj, ret) => ret as any;

  /**
   * Transforms an array of objects returned from an insert into an array
   * of objects to be returned to the caller.
   * @param source The array of objects that were inserted.
   * @param returns The array of objects returned from the insert.
   * @returns Array of objects to be returned to the caller.
   */
  protected transformInsertReturnArray(
    source: InsertedObject[],
    returns: ObjectWithKeys<Selectable<DB[TableName]>, ReturnColumns>[]
  ): ReturnedObject[] {
    if (this.options.insertReturnTransform) {
      return source.map((obj, i) =>
        // TS isn't seeing that that transform is defined.
        this.options.insertReturnTransform!(obj, returns[i])
      );
    }
    return returns as any;
  }

  /**
   * Transforms an object into a row for insertion.
   * @param obj The object to transform.
   * @returns Row representation of the object.
   */
  // This lengthy type provides better type assistance messages
  // in VSCode than a dedicated TransformInsertion type would.
  protected transformUpdater: NonNullable<
    TableLensOptions<
      DB,
      TableName,
      SelectedObject,
      InsertedObject,
      UpdaterObject,
      ReturnColumns,
      ReturnedObject
    >["updaterTransform"]
  > = (obj) => obj as Updateable<DB[TableName]>;

  /**
   * Transforms an array of objects returned from an update
   * into objects to be returned to the caller.
   * @param source The object that provided the update values.
   * @param returns The array of objects returned from the update.
   * @returns Array of objects to be returned to the caller.
   */
  protected transformUpdateReturn(
    source: UpdaterObject,
    returns: ObjectWithKeys<Selectable<DB[TableName]>, ReturnColumns>[]
  ): ReturnedObject[] {
    if (this.options.updateReturnTransform) {
      return returns.map((returnValues) =>
        // TS isn't seeing that that transform is defined.
        this.options.updateReturnTransform!(source, returnValues)
      );
    }
    return returns as any;
  }
}
