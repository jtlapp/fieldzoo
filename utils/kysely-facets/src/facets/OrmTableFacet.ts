import { Kysely, Selectable } from "kysely";

import { SelectivePartial } from "@fieldzoo/generic-types";

import { TableFacetOptions } from "./TableFacet";
import { IdTableFacet } from "./IdTableFacet";

/**
 * A table facet that maps the rows of a table to and from a single object
 * type. The table has a single primary key referred to as the ID column
 * that must be either a number or a string. The ID column defaults to "id".
 * Only objects with falsy IDs can be inserted into the table.
 * @typeparam DB The database type.
 * @typeparam TableName The name of the table.
 * @typeparam IdColumnName The name of the ID column.
 * @typeparam MappedObject The type of the objects that are mapped to and from
 *  the table rows on inserts, updates, and selects.
 * @typeparam ReturnColumns The columns that are returned by when selecting
 *  or updating rows, for use when created the mapped objects. An empty array
 *  returns all columns.
 */
export class OrmTableFacet<
  DB,
  TableName extends keyof DB & string,
  IdColumnName extends keyof Selectable<DB[TableName]> & string = "id" &
    keyof Selectable<DB[TableName]>,
  MappedObject extends Pick<
    Selectable<DB[TableName]>,
    IdColumnName
  > = Selectable<DB[TableName]>,
  ReturnColumns extends (keyof Selectable<DB[TableName]> & string)[] = [
    IdColumnName
  ]
> extends IdTableFacet<
  DB,
  TableName,
  IdColumnName,
  MappedObject,
  SelectivePartial<MappedObject, IdColumnName>,
  MappedObject,
  ReturnColumns,
  MappedObject
> {
  /**
   * Create a new OrmTableFacet.
   * @param db The Kysely database instance.
   * @param tableName The name of the table.
   * @param idColumnName The name of the ID column.
   * @param options Options governing OrmTableFacet behavior.
   */
  constructor(
    db: Kysely<DB>,
    tableName: TableName,
    idColumnName: IdColumnName,
    readonly options: TableFacetOptions<
      DB,
      TableName,
      MappedObject,
      SelectivePartial<MappedObject, IdColumnName>,
      MappedObject,
      ReturnColumns,
      MappedObject
    > = {}
  ) {
    super(
      db,
      tableName,
      idColumnName,
      _prepareOptions(idColumnName, options) as any
    );
  }

  /**
   * Inserts or updates a row from an object. Objects with ID 0 or the empty
   * string are inserted; objects with non-zero, non-empty IDs are updated.
   * @param obj Object to insert or update.
   * @returns the object, or null if the object-to-update was not found.
   */
  async upsert(obj: MappedObject): Promise<MappedObject | null> {
    return !obj[this.idColumnName]
      ? this.insert(obj)
      : (await this.updateById(obj))
      ? obj
      : null;
  }
}

/**
 * Provide default insertTransform.
 */
function _prepareOptions<
  DB,
  TableName extends keyof DB & string,
  IdColumnName extends keyof Selectable<DB[TableName]> & string,
  ReturnColumns extends (keyof Selectable<DB[TableName]> & string)[],
  MappedObject extends Pick<Selectable<DB[TableName]>, IdColumnName>
>(
  idColumnName: IdColumnName,
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
  let insertTransform = options.insertTransform;
  if (!insertTransform) {
    insertTransform = (obj) => {
      return { ...obj, [idColumnName]: undefined } as any;
    };
  }

  return {
    ...options,
    insertTransform: (obj: MappedObject) => {
      if (obj[idColumnName]) {
        throw Error("The ID column of an inserted object must be falsy");
      }
      return insertTransform!(obj);
    },
  };
}
