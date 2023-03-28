import { Insertable, Kysely, Selectable } from "kysely";

import { TableLens, TableLensOptions } from "./TableLens";
import { KeyedTableLens, SingleKeyValue } from "./KeyedTableLens";
import {
  KeyTuple,
  ObjectWithKeys,
  SelectableColumn,
  SelectableColumnTuple,
} from "../lib/type-utils";

/** Default key columns */
// TODO: get this default from KeyedTableLens
const DEFAULT_KEY = ["id"] as const;

/**
 * Interface for keyed objects.
 */
// TODO: maybe rename this to TableObject?
export interface KeyedObject<
  T,
  PrimaryKeyColumns extends SelectableColumnTuple<T>
> {
  getKey(): KeyTuple<T, PrimaryKeyColumns>;
}

/**
 * A lens for a table representing a store of objects, where each object has a
 * unique identifying key given by one or more primary key columns.
 * @typeparam DB The database type.
 * @typeparam TableName The name of the table.
 * @typeparam MappedObject The type of the objects that are mapped to and from
 *  the table rows on inserts, updates, and selects.
 * @typeparam PrimaryKeyColumns Tuple of the names of the primary key columns.
 *  Defaults to `["id"]`.
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
> extends TableLens<
  DB,
  TableName,
  MappedObject,
  MappedObject,
  Partial<Insertable<DB[TableName]>>,
  ReturnColumns,
  MappedObject
> {
  protected keyedTableLens: KeyedTableLens<
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
   *  columns. `insertReturnTransform` defaults to a transform that adds the
   *  return columns. `updaterTransform` defaults to the `insertTransform`
   *  and `updateReturnTransform` defaults to the `insertReturnTransform`,
   *  but the update transforms only apply to the `save()` method.
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
    super(
      db,
      tableName,
      _prepareBaseOptions(primaryKeyColumns, options) as any
    );
    this.keyedTableLens = new KeyedTableLens(db, tableName, primaryKeyColumns, {
      ...this.options,
      updaterTransform:
        options.updaterTransform ?? this.options.insertTransform,
      updateReturnTransform:
        options.updateReturnTransform ?? this.options.insertReturnTransform,
    } as any);
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
    return this.keyedTableLens.deleteByKey(key);
  }

  /**
   * Saves an object as a row in the table. Objects having at least one
   * falsy primary key (0 or "") are inserted; objects whose primary keys
   * are all truthy are updated.
   * @param obj Object to save.
   * @returns the object, or null if the object-to-update was not found.
   */
  // TODO: replace with an update, requiring caller to also call insert
  async save(obj: MappedObject): Promise<MappedObject | null> {
    const key = obj.getKey();
    return !(key as any[]).every((v) => !!v)
      ? this.keyedTableLens.insert(obj)
      : this.keyedTableLens.updateByKey(key, obj);
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
    return this.keyedTableLens.selectByKey(key);
  }
}

/**
 * Provide default transformations for the base TableLens.
 */
function _prepareBaseOptions<
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
  const baseOptions = {
    insertTransform: (obj: MappedObject) => {
      const insertion = { ...obj };
      primaryKeyColumns.forEach(
        (column) => delete insertion[column as keyof MappedObject]
      );
      return insertion;
    },
    insertReturnTransform: (
      obj: MappedObject,
      returns: ObjectWithKeys<Selectable<DB[TableName]>, ReturnColumns>
    ) => {
      return { ...obj, ...returns };
    },
    returnColumns: DEFAULT_KEY,
    ...options,
  };
  // Base update methods operate on columns, not the mapped object.
  delete baseOptions["updaterTransform"];
  delete baseOptions["updateReturnTransform"];
  return baseOptions;
}
