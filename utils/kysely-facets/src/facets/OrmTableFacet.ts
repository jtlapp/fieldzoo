import { Kysely, Selectable, SelectType } from "kysely";

import { TableFacetOptions } from "./TableFacet";
import { IdTableFacet } from "./IdTableFacet";
import { ObjectWithKeys } from "../lib/type-utils";

/**
 * Interface for ORM objects.
 */
export interface OrmObject<IdType> {
  getId(): IdType;
}

/**
 * A table facet that maps the rows of a table to and from a single object
 * type. The table has a single primary key referred to as the ID column,
 * and it defaults to the name "id".
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
  MappedObject extends OrmObject<SelectType<DB[TableName][IdColumnName]>>,
  IdColumnName extends keyof Selectable<DB[TableName]> & string = "id" &
    keyof Selectable<DB[TableName]>,
  ReturnColumns extends (keyof Selectable<DB[TableName]> & string)[] = [
    IdColumnName
  ]
> extends IdTableFacet<
  DB,
  TableName,
  IdColumnName,
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
   * @param idColumnName The name of the ID column.
   * @param options Options governing OrmTableFacet behavior. By default, the
   *  ID columns is removed from insertions and added to insertion returns.
   */
  constructor(
    db: Kysely<DB>,
    tableName: TableName,
    idColumnName: IdColumnName,
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
    const id = obj.getId();
    return !id ? this.insert(obj) : await this.updateByIdReturning(id, obj);
  }
}

/**
 * Provide default insertTransform.
 */
function _prepareOptions<
  DB,
  TableName extends keyof DB & string,
  MappedObject extends OrmObject<SelectType<DB[TableName][IdColumnName]>>,
  IdColumnName extends keyof Selectable<DB[TableName]> & string,
  ReturnColumns extends (keyof Selectable<DB[TableName]> & string)[]
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
  const returnTransform = (
    obj: MappedObject,
    returns: ObjectWithKeys<Selectable<DB[TableName]>, ReturnColumns>
  ) => {
    return { ...obj, ...returns };
  };

  return {
    insertTransform: (obj: MappedObject) => {
      return { ...obj, [idColumnName]: undefined } as any;
    },
    insertReturnTransform: returnTransform,
    updateReturnTransform: returnTransform,
    ...options,
  };
}
