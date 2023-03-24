import {
  Insertable,
  Kysely,
  ReferenceExpression,
  Selectable,
  SelectType,
  WhereInterface,
} from "kysely";
import { allOf } from "../filters/CompoundFilter";
import { QueryFilter } from "../filters/QueryFilter";
import { ObjectWithKeys } from "../lib/type-utils";

import { TableFacetOptions, TableFacet } from "./TableFacet";

/** Default key columns */
const DEFAULT_KEY = ["id"] as const;

/**
 * Type of the primary key tuple whose column names are given by `S`
 * and are found in the table interface `T`.
 * @typeparam T Table interface.
 * @typeparam S Array of the primary key column names.
 */
export type KeyTuple<T, KA extends (keyof Selectable<T>)[]> = [
  SelectType<T[KA[number]]>,
  ...SelectType<T[KA[number]]>[]
];

/**
 * Interface that updater objects must implement to provide a key, if
 * the key is not to be taken directly from the object's properties.
 */
export interface KeyedObject<T, S extends (keyof Selectable<T>)[]> {
  getKey?: () => KeyTuple<T, S>;
}

/**
 * Facet for a table with compound primary key.
 * @typeparam DB Interface whose fields are table names defining tables.
 * @typeparam TableName Name of the table.
 * @typeparam PrimaryKeyColumns Arrayof names of the primary key columns.
 * @typeparam SelectedObject Type of objects returned by select queries.
 * @typeparam InsertedObject Type of objects inserted into the table.
 * @typeparam UpdaterObject Type of objects used to update rows of the table.
 * @typeparam ReturnColumns Columns to return from table upon request, whether
 *  returning from an insert or an update. An empty array returns all columns.
 * @typeparam ReturnedObject Type of objects returned from inserts and updates,
 *  when returning objects.
 */
export class KeyedTableFacet<
  DB,
  TableName extends keyof DB & string,
  PrimaryKeyColumns extends (keyof Selectable<DB[TableName]> & string)[] = [
    "id" & keyof Selectable<DB[TableName]>
  ],
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
    readonly primaryKeyColumns: PrimaryKeyColumns = DEFAULT_KEY as any,
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
   * @param key The key of the row to delete.
   * @returns True if a row was deleted, false otherwise.
   */
  async deleteByKey(
    key: KeyTuple<DB[TableName], PrimaryKeyColumns>
  ): Promise<boolean> {
    const count = await this.delete(this.filterForKey(key));
    return count == 1;
  }

  /**
   * Select the row having the given key.
   * @param key The key of the row to select.
   * @returns An object for the row, or null if no row was found.
   */
  selectByKey(
    key: KeyTuple<DB[TableName], PrimaryKeyColumns>
  ): Promise<SelectedObject | null> {
    return this.selectOne(this.filterForKey(key));
  }

  /**
   * Update the row having the object's key, without returning any columns.
   * @param obj Object containing the fields to update. The key of the row
   *  to update is taken from this object.
   * @returns True if a row was updated, false otherwise.
   */
  async updateByKey(
    key: KeyTuple<DB[TableName], PrimaryKeyColumns>,
    obj: UpdaterObject
  ): Promise<boolean> {
    const updateCount = await this.updateGetCount(
      this.filterForKey(key),
      obj as any
    );
    return updateCount == 1;
  }

  /**
   * Update the row having the object's key, returning the columns specified
   * in the `returnColumns` option from the row or rows.
   * @param obj Object containing the fields to update. The key of the row
   * to update is taken from this object.
   * @returns An object for the row, or null if no row was found.
   */
  async updateByKeyReturning(
    key: KeyTuple<DB[TableName], PrimaryKeyColumns>,
    obj: UpdaterObject
  ): Promise<ReturnedObject | null> {
    const updates = await this.update(this.filterForKey(key), obj as any);
    return updates.length == 0 ? null : updates[0];
  }

  /**
   * Returns a filter that restricts a query to the provided compound key.
   * @param key The compound key to filter by.
   * @returns A filter that restricts a query to the provided compound key.
   */
  protected filterForKey<QB extends WhereInterface<any, any>>(
    key: KeyTuple<DB[TableName], PrimaryKeyColumns>
  ) {
    const filter: QueryFilter<
      DB,
      TableName,
      QB,
      ReferenceExpression<DB, TableName>
    >[] = [];
    for (let i = 0; i < this.primaryKeyColumns.length; i++) {
      const columnName = this.primaryKeyColumns[i];
      filter.push([this.ref(columnName), "=", key[i]]);
    }
    return allOf(...filter);
  }
}

/**
 * Default `returnColumns` to the primary keys.
 */
function _prepareOptions<
  DB,
  TableName extends keyof DB & string,
  PrimaryKeyColumns extends (keyof Selectable<DB[TableName]> & string)[],
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
