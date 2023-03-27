import { Kysely, Selectable } from "kysely";

import { TableLensOptions } from "./TableLens";
import { KeyedTableLens, SingleKeyValue } from "./KeyedTableLens";
import {
  KeyTuple,
  ObjectWithKeys,
  SelectableColumn,
  SelectableColumnTuple,
} from "../lib/type-utils";

/** Default key columns */
const DEFAULT_KEY = ["id"] as const;

/**
 * Interface for keyed objects.
 */
export interface KeyedObject<
  T,
  PrimaryKeyColumns extends SelectableColumnTuple<T>
> {
  getKey(): KeyTuple<T, PrimaryKeyColumns>;
}

/**
 * A table lens that maps the rows of a table to and from a single keyed
 * object type. The table has a one or more primary key columns.
 * @typeparam DB The database type.
 * @typeparam TableName The name of the table.
 * @typeparam MappedObject The type of the objects that are mapped to and from
 *  the table rows on inserts, updates, and selects.
 * @typeparam PrimaryKeyColumns Tuple of the names of the primary key columns.
 * @typeparam ReturnColumns The columns that are returned from the database
 *  when selecting or updating rows, for use when creating the mapped objects.
 *  `["*"]` returns all columns; `[]` returns none. Defaults to `PrimaryKeyColumns`.
 */
export class ObjectTableLens<
  DB,
  TableName extends keyof DB & string,
  MappedObject extends KeyedObject<DB[TableName], PrimaryKeyColumns>,
  PrimaryKeyColumns extends SelectableColumnTuple<DB[TableName]> = [
    "id" & SelectableColumn<DB[TableName]>
  ],
  ReturnColumns extends
    | (keyof Selectable<DB[TableName]> & string)[]
    | ["*"] = PrimaryKeyColumns
> {
  protected tableLens: KeyedTableLens<
    DB,
    TableName,
    PrimaryKeyColumns,
    MappedObject,
    MappedObject,
    MappedObject,
    ReturnColumns,
    MappedObject
  >;

  /**
   * Create a new ObjectTableLens.
   * @param db The Kysely database instance.
   * @param tableName The name of the table.
   * @param primaryKeyColumns The names of the primary key columns.
   * @param options Options governing ObjectTableLens behavior.
   *  `insertTransform` defaults to a transform that removes the primary key
   *  columns. `updaterTransform` defaults to the `insertTransform`.
   *  `insertReturnTransform` defaults to a transform that adds the return
   *  columns. `updateReturnTransform` defaults to the `insertReturnTransform`.
   */
  constructor(
    db: Kysely<DB>,
    tableName: TableName,
    primaryKeyColumns: Readonly<PrimaryKeyColumns> = DEFAULT_KEY as any,
    options: TableLensOptions<
      DB,
      TableName,
      MappedObject,
      MappedObject,
      MappedObject,
      ReturnColumns,
      MappedObject
    > = {}
  ) {
    this.tableLens = new KeyedTableLens(
      db,
      tableName,
      primaryKeyColumns,
      _prepareOptions(primaryKeyColumns, options) as any
    );
  }
  /**
   * Delete the row for the object having the given key.
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
    return this.tableLens.deleteByKey(key);
  }

  /**
   * Saves an object as a row in the table. Objects having at least one
   * falsy primary key (0 or "") are inserted; objects whose primary keys
   * are all truthy are updated.
   * @param obj Object to save.
   * @returns the object, or null if the object-to-update was not found.
   */
  async save(obj: MappedObject): Promise<MappedObject | null> {
    const key = obj.getKey();
    return !(key as any[]).every((v) => !!v)
      ? this.tableLens.insert(obj)
      : await this.tableLens.updateByKey(key, obj);
  }

  /**
   * Select the object for the row having the given key.
   * @param key The key of the row to select. If there is only one primary
   *  key column, this can be the value of the key. Otherwise, this must be
   *  a tuple of the key values.
   * @returns An object for the row, or null if no row was found.
   */
  selectByKey(
    key:
      | SingleKeyValue<DB[TableName], PrimaryKeyColumns>
      | Readonly<KeyTuple<DB[TableName], PrimaryKeyColumns>>
  ): Promise<MappedObject | null> {
    return this.tableLens.selectByKey(key);
  }
}

/**
 * Provide default insertTransform.
 */
function _prepareOptions<
  DB,
  TableName extends keyof DB & string,
  MappedObject extends KeyedObject<DB[TableName], PrimaryKeyColumns>,
  PrimaryKeyColumns extends SelectableColumnTuple<DB[TableName]>,
  ReturnColumns extends (keyof Selectable<DB[TableName]> & string)[] | ["*"]
>(
  primaryKeyColumns: Readonly<PrimaryKeyColumns>,
  options: TableLensOptions<
    DB,
    TableName,
    MappedObject,
    MappedObject,
    MappedObject,
    ReturnColumns,
    MappedObject
  >
) {
  const insertTransform =
    options.insertTransform ??
    ((obj: MappedObject) => {
      const insertion = { ...obj };
      primaryKeyColumns.forEach(
        (column) => delete insertion[column as keyof MappedObject]
      );
      return insertion;
    });
  const insertReturnTransform =
    options.insertReturnTransform ??
    ((
      obj: MappedObject,
      returns: ObjectWithKeys<Selectable<DB[TableName]>, ReturnColumns>
    ) => {
      return { ...obj, ...returns };
    });

  return {
    insertTransform,
    updaterTransform: options.insertTransform ?? insertTransform,
    insertReturnTransform,
    updateReturnTransform:
      options.insertReturnTransform ?? insertReturnTransform,
    ...options,
  };
}
