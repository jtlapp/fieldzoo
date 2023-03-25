import { Kysely, Selectable } from "kysely";

import { TableFacetOptions } from "./TableFacet";
import { KeyedTableFacet } from "./KeyedTableFacet";
import {
  KeyTuple,
  ObjectWithKeys,
  SelectableColumn,
  SelectableColumnTuple,
} from "../lib/type-utils";

/** Default key columns */
const DEFAULT_KEY = ["id"] as const;

/**
 * Interface for ORM objects.
 */
export interface OrmObject<
  T,
  PrimaryKeyColumns extends SelectableColumnTuple<T>
> {
  getKey(): KeyTuple<T, PrimaryKeyColumns>;
}

/**
 * A table facet that maps the rows of a table to and from a single object
 * type. The table has a one or more primary key columns.
 * @typeparam DB The database type.
 * @typeparam TableName The name of the table.
 * @typeparam MappedObject The type of the objects that are mapped to and from
 *  the table rows on inserts, updates, and selects.
 * @typeparam PrimaryKeyColumns Tuple of the names of the primary key columns.
 * @typeparam ReturnColumns The columns that are returned from the database
 *  when selecting or updating rows, for use when creating the mapped objects.
 *  `["*"]` returns all columns; `[]` returns none. Defaults to `PrimaryKeyColumns`.
 */
export class OrmTableFacet<
  DB,
  TableName extends keyof DB & string,
  MappedObject extends OrmObject<DB[TableName], PrimaryKeyColumns>,
  PrimaryKeyColumns extends SelectableColumnTuple<DB[TableName]> = [
    "id" & SelectableColumn<DB[TableName]>
  ],
  ReturnColumns extends
    | (keyof Selectable<DB[TableName]> & string)[]
    | ["*"] = PrimaryKeyColumns
> extends KeyedTableFacet<
  DB,
  TableName,
  PrimaryKeyColumns,
  MappedObject,
  MappedObject,
  MappedObject,
  ReturnColumns,
  MappedObject
> {
  /**
   * Create a new OrmTableFacet.
   * @param db The Kysely database instance.
   * @param tableName The name of the table.
   * @param primaryKeyColumns The names of the primary key columns.
   * @param options Options governing OrmTableFacet behavior.
   */
  constructor(
    db: Kysely<DB>,
    tableName: TableName,
    primaryKeyColumns: Readonly<PrimaryKeyColumns> = DEFAULT_KEY as any,
    options: TableFacetOptions<
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
      primaryKeyColumns,
      _prepareOptions(primaryKeyColumns, options) as any
    );
  }

  /**
   * Inserts or updates a row from an object. Objects having at least one
   * falsy primary key (0 or "") are inserted; objects whose primary keys
   * are all truthy are updated.
   * @param obj Object to insert or update.
   * @returns the object, or null if the object-to-update was not found.
   */
  async upsert(obj: MappedObject): Promise<MappedObject | null> {
    const key = obj.getKey();
    return !(key as any[]).every((v) => !!v)
      ? this.insert(obj)
      : await this.updateByKey(key, obj);
  }
}

/**
 * Provide default insertTransform.
 */
function _prepareOptions<
  DB,
  TableName extends keyof DB & string,
  MappedObject extends OrmObject<DB[TableName], PrimaryKeyColumns>,
  PrimaryKeyColumns extends SelectableColumnTuple<DB[TableName]>,
  ReturnColumns extends (keyof Selectable<DB[TableName]> & string)[] | ["*"]
>(
  primaryKeyColumns: Readonly<PrimaryKeyColumns>,
  options: TableFacetOptions<
    DB,
    TableName,
    MappedObject,
    MappedObject,
    MappedObject,
    ReturnColumns,
    MappedObject
  >
) {
  const returnTransform = (
    obj: MappedObject,
    returns: ObjectWithKeys<Selectable<DB[TableName]>, ReturnColumns>
  ) => {
    return { ...obj, ...returns };
  };

  return {
    insertTransform: (obj: MappedObject) => {
      const insertion = { ...obj };
      primaryKeyColumns.forEach(
        (column) => delete insertion[column as keyof MappedObject]
      );
      return insertion;
    },
    insertReturnTransform: returnTransform,
    updateReturnTransform: returnTransform,
    ...options,
  };
}
