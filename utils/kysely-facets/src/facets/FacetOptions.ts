import { Insertable, Selectable, Updateable } from "kysely";
import { ObjectWithKeys } from "../lib/type-utils";

/**
 * Options governing facet behavior.
 */
export interface FacetOptions<
  DB,
  TableName extends keyof DB & string,
  SelectedType,
  InsertedType,
  UpdateObject,
  ReturnColumns extends (keyof Selectable<DB[TableName]> & string)[] | ["*"],
  ReturnedObject
> {
  /** Transformation to apply to selected objects. */
  selectTransform?: (row: Selectable<DB[TableName]>) => SelectedType;

  /** Transformation to apply to inserted objects. */
  insertTransform?: (obj: InsertedType) => Insertable<DB[TableName]>;

  /** Transformation to apply to updated objects. */
  updateTransform?: (update: UpdateObject) => Updateable<DB[TableName]>;

  /** Columns to return from table upon insertion or update. */
  returnColumns?: ReturnColumns;

  /** Transformation to apply to data returned from inserts. */
  insertReturnTransform?: (
    source: InsertedType,
    returns: ObjectWithKeys<Selectable<DB[TableName]>, ReturnColumns>
  ) => ReturnedObject;

  /** Transformation to apply to data returned from updates. */
  updateReturnTransform?: (
    source: UpdateObject,
    returns: ObjectWithKeys<Selectable<DB[TableName]>, ReturnColumns>
  ) => ReturnedObject;
}
