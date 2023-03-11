import {
  Kysely,
  Insertable,
  ReferenceExpression,
  Selectable,
  Updateable,
  InsertQueryBuilder,
  InsertResult,
} from "kysely";

import { FacetOptions, KyselyFacet } from "./KyselyFacet";
import { QueryFilter, applyQueryFilter } from "../filters/QueryFilter";
import { ObjectWithKeys } from "../lib/type-utils";

// TODO: Configure type of returned counts (e.g. number vs bigint)

type DeleteQB<DB, TableName extends keyof DB & string> = ReturnType<
  StandardFacet<DB, TableName, any>["deleteQB"]
>;
type UpdateQB<DB, TableName extends keyof DB & string> = ReturnType<
  StandardFacet<DB, TableName, any>["updateQB"]
>;

/**
 * Options governing StandardFacet behavior.
 */
export interface StandardFacetOptions<
  DB,
  TableName extends keyof DB & string,
  SelectedObject,
  InsertedObject,
  UpdaterObject,
  ReturnColumns extends (keyof Selectable<DB[TableName]> & string)[] | ["*"],
  ReturnedObject
> extends FacetOptions<DB, TableName, SelectedObject> {
  /** Transformation to apply to inserted objects before insertion. */
  readonly insertTransform?: (obj: InsertedObject) => Insertable<DB[TableName]>;

  /** Transformation to apply to objects provided for updating values. */
  readonly updaterTransform?: (
    update: UpdaterObject
  ) => Updateable<DB[TableName]>;

  /** Columns to return from table upon insertion or update. */
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
   * @param options Options governing facet behavior.
   */
  constructor(
    db: Kysely<DB>,
    tableName: TableName,
    readonly options: StandardFacetOptions<
      DB,
      TableName,
      SelectedObject,
      InsertedObject,
      UpdaterObject,
      ReturnColumns,
      ReturnedObject
    > = {}
  ) {
    super(db, tableName, options);

    if (options.insertReturnTransform) {
      if (!options.returnColumns) {
        throw Error("'insertReturnTransform' requires 'returnColumns'");
      }
      if (options.returnColumns?.length === 0) {
        throw Error("No 'returnColumns' returned for 'insertReturnTransform'");
      }
    }
    if (options.updateReturnTransform) {
      if (!options.returnColumns) {
        throw Error("'updateReturnTransform' requires 'returnColumns'");
      }
      if (options.returnColumns?.length === 0) {
        throw Error("No 'returnColumns' returned for 'updateReturnTransform'");
      }
    }

    if (options.insertTransform) {
      this.transformInsertion = options.insertTransform;
    }
    if (options.updaterTransform) {
      this.transformUpdater = options.updaterTransform;
    }
    if (options.insertReturnTransform) {
      this.transformInsertReturn = options.insertReturnTransform;
    }

    this.returnColumns = null;
    if (options.returnColumns) {
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
   * Inserts one or more rows into this table, without returning any
   * columns, regardless of whether `returnColumns` was configured.
   * @param objOrObjs The object or objects to insert as a row.
   */
  insert(obj: InsertedObject): Promise<void>;

  insert(objs: InsertedObject[]): Promise<void>;

  async insert(objOrObjs: InsertedObject | InsertedObject[]): Promise<void> {
    const transformedObjOrObjs = this.transformInsertion(objOrObjs as any);
    const qb = this.insertQB().values(transformedObjOrObjs);
    await qb.execute();
  }

  /**
   * Inserts one or more rows into this table, returning the columns
   * specified in the `returnColumns` option from the row or rows.
   * @param objOrObjs The object or objects to insert as a row.
   * @returns Returns a `ReturnedObject` for each inserted object. An
   *  array when `objOrObjs` is an array, and a single object otherwise.
   * @throws Error if `ReturnedObject` was not assigned.
   */
  insertReturning(obj: InsertedObject): Promise<ReturnedObject>;

  insertReturning(objs: InsertedObject[]): Promise<ReturnedObject[]>;

  async insertReturning(
    objOrObjs: InsertedObject | InsertedObject[]
  ): Promise<ReturnedObject | ReturnedObject[]> {
    // TODO: maybe return empty objects in this case?
    if (this.returnColumns === null) {
      throw Error("No 'returnColumns' configured for 'insertReturning'");
    }

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

    // Assign `returns` all at once to capture its complex type. Can't place
    // this in a shared method because the types are not compatible.
    const returns =
      this.returnColumns.length == 0
        ? await qb.returningAll().execute()
        : await qb.returning(this.returnColumns).execute();
    if (returns === undefined) {
      throw Error("No rows returned from insert expecting returned columns");
    }
    if (insertedAnArray) {
      return this.transformInsertReturnArray(objOrObjs, returns as any);
    }
    return this.transformInsertReturn(objOrObjs, returns[0] as any);
  }

  /**
   * Creates a query builder for updating rows in this table.
   * @returns A query builder for updating rows in this table.
   */
  updateQB() {
    return this.db.updateTable(this.tableName);
  }

  /**
   * Updates rows in this table matching the provided filter, without returning
   * any columns, regardless of whether `returnColumns` was configured.
   * @param filter Filter specifying the rows to update.
   * @param obj The object whose field values are to be assigned to the row.
   * @returns Returns the number of updated rows.
   */
  async update<RE extends ReferenceExpression<DB, TableName>>(
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
   * Updates rows in this table matching the provided filter, returning the
   * columns specified in the `returnColumns` option from the row or rows.
   * @param filter Filter specifying the rows to update.
   * @param obj The object whose field values are to be assigned to the row.
   * @returns Returns an array of `ReturnedObject` objects, one for each
   *  updated row.
   * @throws Error if `ReturnedObject` was not assigned.
   */
  async updateReturning<RE extends ReferenceExpression<DB, TableName>>(
    filter: QueryFilter<DB, TableName, UpdateQB<DB, TableName>, RE>,
    obj: UpdaterObject
  ): Promise<ReturnedObject[]> {
    if (this.returnColumns === null) {
      throw Error("No 'returnColumns' configured for 'updateReturning'");
    }

    const transformedObj = this.transformUpdater(obj);
    const uqb = this.updateQB().set(transformedObj as any);
    const fqb = applyQueryFilter(this, filter)(uqb);

    // Assign `returns` all at once to capture its complex type. Can't place
    // this in a shared method because the types are not compatible.
    const returns =
      this.returnColumns.length == 0
        ? await fqb.returningAll().execute()
        : await fqb.returning(this.returnColumns as any).execute();
    if (returns === undefined) {
      throw Error("No rows returned from update expecting returned columns");
    }
    return this.transformUpdateReturn(obj, returns as any) as any;
  }

  /**
   * Transforms an object into a row for insertion.
   * @param obj The object to transform.
   * @returns Row representation of the object.
   */
  // This lengthy type provides better type assistance messages
  // in VSCode than a dedicated TransformInsertion type would.
  protected transformInsertion: NonNullable<
    StandardFacetOptions<
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
    StandardFacetOptions<
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
    StandardFacetOptions<
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
