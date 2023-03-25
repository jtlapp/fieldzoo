import {
  Insertable,
  Kysely,
  ReferenceExpression,
  Selectable,
  WhereInterface,
} from "kysely";
import { allOf } from "../filters/CompoundFilter";
import { QueryFilter } from "../filters/QueryFilter";
import { ObjectWithKeys } from "../lib/type-utils";

import { TableFacetOptions, TableFacet } from "./TableFacet";

/** Default key columns */
const DEFAULT_KEY = ["id"] as const;

// TODO: Make all modifiable structures readonly when possible.

/** Shorthand type for a key column. */
type KeyColumn<T> = keyof Selectable<T> & string;

/**
 * Type of the primary key, when there is only one primary key.
 * @typeparam T Table interface.
 * @typeparam KA Array of the primary key column names.
 */
export type SingleKeyValue<
  T,
  KA extends (keyof Selectable<T> & string)[]
> = KA extends [any] ? Selectable<T>[KA[0]] : never;

/**
 * Type of the primary key tuple whose column names are given by `KA` and are
 * found in the table interface `T`. Supports up to 4 columns.
 * @typeparam T Table interface.
 * @typeparam KA Array of the primary key column names.
 */
export type KeyTuple<
  T,
  KA extends (keyof Selectable<T> & string)[]
> = Selectable<T>[KA[3]] extends string
  ? [
      Selectable<T>[KA[0]],
      Selectable<T>[KA[1]],
      Selectable<T>[KA[2]],
      Selectable<T>[KA[3]]
    ]
  : Selectable<T>[KA[2]] extends string
  ? [Selectable<T>[KA[0]], Selectable<T>[KA[1]], Selectable<T>[KA[2]]]
  : Selectable<T>[KA[1]] extends string
  ? [Selectable<T>[KA[0]], Selectable<T>[KA[1]]]
  : [Selectable<T>[KA[0]]];

/**
 * Interface that updater objects must implement to provide a key, if
 * the key is not to be taken directly from the object's properties.
 * @typeparam T Table interface.
 * @typeparam KA Array of the primary key column names.
 */
export interface KeyedObject<T, KA extends (keyof Selectable<T> & string)[]> {
  getKey?: () => KeyTuple<T, KA>;
}

/**
 * Facet for a table with compound primary key.
 * @typeparam DB Interface whose fields are table names defining tables.
 * @typeparam TableName Name of the table.
 * @typeparam PrimaryKeyColumns Arrayof names of the primary key columns.
 * @typeparam SelectedObject Type of objects returned by select queries.
 * @typeparam InsertedObject Type of objects inserted into the table.
 * @typeparam UpdaterObject Type of objects used to update rows of the table.
 * @typeparam ReturnColumns Columns to return from the table on insert or
 *  update, except when explicitly requesting no columns. `["*"]` returns
 *  all columns; `[]` returns none. Defaults to `PrimaryKeyColumns`.
 * @typeparam ReturnedObject Objects to return from inserts and updates.
 */
export class KeyedTableFacet<
  DB,
  TableName extends keyof DB & string,
  PrimaryKeyColumns extends
    | [KeyColumn<DB[TableName]>]
    | [KeyColumn<DB[TableName]>, KeyColumn<DB[TableName]>]
    | [
        KeyColumn<DB[TableName]>,
        KeyColumn<DB[TableName]>,
        KeyColumn<DB[TableName]>
      ]
    | [
        KeyColumn<DB[TableName]>,
        KeyColumn<DB[TableName]>,
        KeyColumn<DB[TableName]>,
        KeyColumn<DB[TableName]>
      ] = ["id" & KeyColumn<DB[TableName]>],
  SelectedObject = Selectable<DB[TableName]>,
  InsertedObject = Insertable<DB[TableName]>,
  UpdaterObject extends object &
    Partial<KeyedObject<DB[TableName], PrimaryKeyColumns>> = Partial<
    Insertable<DB[TableName]>
  >,
  ReturnColumns extends
    | (keyof Selectable<DB[TableName]> & string)[]
    | ["*"] = PrimaryKeyColumns,
  ReturnedObject = ReturnColumns extends ["*"]
    ? Selectable<DB[TableName]>
    : ObjectWithKeys<Selectable<DB[TableName]>, ReturnColumns>
> extends TableFacet<
  DB,
  TableName,
  SelectedObject,
  InsertedObject,
  UpdaterObject,
  ReturnColumns,
  ReturnedObject
> {
  // TODO: have options.returnColumns default to ["id"]

  /**
   * Constructs a new keyed table facet.
   * @param db The Kysely database.
   * @param tableName The name of the table.
   * @param primaryKeyColumns The names of the primary key columns,
   *  expressed as a tuplet. Defaults to `["id"]`.
   * @param options Options governing facet behavior. `returnColumns`
   *  defaults to returning the key columns.
   */
  constructor(
    db: Kysely<DB>,
    tableName: TableName,
    readonly primaryKeyColumns: Readonly<PrimaryKeyColumns> = DEFAULT_KEY as any,
    options: TableFacetOptions<
      DB,
      TableName,
      SelectedObject,
      InsertedObject,
      UpdaterObject,
      ReturnColumns,
      ReturnedObject
    > = {}
  ) {
    super(db, tableName, _prepareOptions(options, primaryKeyColumns) as any);
  }

  /**
   * Delete the row having the given key.
   * @param key The key of the row to delete. If there is only one primary
   *  key column, this can be the value of the key. Otherwise, this must be
   * a tuple of the key values.
   * @returns True if a row was deleted, false otherwise.
   */
  async deleteByKey(
    key:
      | SingleKeyValue<DB[TableName], PrimaryKeyColumns>
      | Readonly<KeyTuple<DB[TableName], PrimaryKeyColumns>>
  ): Promise<boolean> {
    const count = await this.delete(this.filterForKey(key));
    return count == 1;
  }

  /**
   * Select the row having the given key.
   * @param key The key of the row to select. If there is only one primary
   *  key column, this can be the value of the key. Otherwise, this must be
   *  a tuple of the key values.
   * @returns An object for the row, or null if no row was found.
   */
  selectByKey(
    key:
      | SingleKeyValue<DB[TableName], PrimaryKeyColumns>
      | Readonly<KeyTuple<DB[TableName], PrimaryKeyColumns>>
  ): Promise<SelectedObject | null> {
    return this.selectOne(this.filterForKey(key));
  }

  /**
   * Update the row having the given key. Retrieves the columns specified in
   * the `returnColumns` option, returning them unless `updateReturnTransform`
   * transforms them into `ReturnedObject`. If `returnColumns` is empty,
   * returns nothing.
   * @param key The key of the row to update. If there is only one primary
   *  key column, this can be the value of the key. Otherwise, this must be
   *  a tuple of the key values.
   * @param obj Object containing the fields to update. The key of the row
   *  to update is taken from this object.
   * @returns An object for the row, or null if no row was found.
   */
  async updateByKey(
    key:
      | SingleKeyValue<DB[TableName], PrimaryKeyColumns>
      | Readonly<KeyTuple<DB[TableName], PrimaryKeyColumns>>,
    obj: UpdaterObject
  ): Promise<ReturnedObject | null> {
    const updates = await this.update(this.filterForKey(key), obj as any);
    return updates.length == 0 ? null : updates[0];
  }

  /**
   * Update the row having the given key, without returning any columns.
   * @param key The key of the row to update. If there is only one primary
   *  key column, this can be the value of the key. Otherwise, this must be
   *  a tuple of the key values.
   * @param obj Object containing the fields to update. The key of the row
   *  to update is taken from this object.
   * @returns True if a row was updated, false otherwise.
   */
  async updateByKeyNoReturns(
    key:
      | SingleKeyValue<DB[TableName], PrimaryKeyColumns>
      | Readonly<KeyTuple<DB[TableName], PrimaryKeyColumns>>,
    obj: UpdaterObject
  ): Promise<boolean> {
    const updateCount = await this.updateGetCount(
      this.filterForKey(key),
      obj as any
    );
    return updateCount == 1;
  }

  /**
   * Returns a filter that restricts a query to the provided key.
   * @param key The key to filter by.
   * @returns A filter that restricts a query to the provided key.
   */
  protected filterForKey<QB extends WhereInterface<any, any>>(
    key:
      | SingleKeyValue<DB[TableName], PrimaryKeyColumns>
      | Readonly<KeyTuple<DB[TableName], PrimaryKeyColumns>>
  ): QueryFilter<DB, TableName, QB, ReferenceExpression<DB, TableName>> {
    if (Array.isArray(key)) {
      const filter: QueryFilter<
        DB,
        TableName,
        QB,
        ReferenceExpression<DB, TableName>
      >[] = [];
      for (let i = 0; i < this.primaryKeyColumns.length; i++) {
        const columnName = this.primaryKeyColumns[i];
        filter.push([
          this.ref(columnName),
          "=",
          (key as KeyTuple<DB[TableName], PrimaryKeyColumns>)[i],
        ]);
      }
      return allOf(...filter);
    }
    return [this.ref(this.primaryKeyColumns[0]), "=", key];
  }
}

/**
 * Default `returnColumns` to the primary keys.
 */
function _prepareOptions<
  DB,
  TableName extends keyof DB & string,
  PrimaryKeyColumns extends Readonly<
    (keyof Selectable<DB[TableName]> & string)[]
  >,
  SelectedObject,
  InsertedObject,
  UpdaterObject,
  ReturnColumns extends (keyof Selectable<DB[TableName]> & string)[] | ["*"],
  ReturnedObject
>(
  options: TableFacetOptions<
    DB,
    TableName,
    SelectedObject,
    InsertedObject,
    UpdaterObject,
    ReturnColumns,
    ReturnedObject
  >,
  primaryKeyColumns: PrimaryKeyColumns
) {
  return {
    returnColumns: primaryKeyColumns,
    ...options,
  };
}
