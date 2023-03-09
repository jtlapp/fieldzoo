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
  UpdaterObject,
  ReturnColumns extends (keyof Selectable<DB[TableName]> & string)[] | ["*"],
  ReturnObject
> {
  /** Transformation to apply to selected objects. */
  selectTransform?: (row: Selectable<DB[TableName]>) => SelectedType;

  /** Transformation to apply to inserted objects. */
  insertTransform?: (obj: InsertedType) => Insertable<DB[TableName]>;

  /** Transformation to apply to updated objects. */
  updateTransform?: (update: UpdaterObject) => Updateable<DB[TableName]>;

  /** Columns to return from table upon insertion or update. */
  returnColumns?: ReturnColumns;

  /** Transformation to apply to data returned from inserts. */
  insertReturnTransform?: (
    source: InsertedType,
    returns: ObjectWithKeys<Selectable<DB[TableName]>, ReturnColumns>
  ) => ReturnObject;

  /** Transformation to apply to data returned from updates. */
  updateReturnTransform?: (
    source: UpdaterObject,
    returns: ObjectWithKeys<Selectable<DB[TableName]>, ReturnColumns>
  ) => ReturnObject;
}
