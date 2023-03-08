import { Insertable, Selectable, Updateable } from "kysely";

/**
 * Options governing facet behavior.
 */
export interface FacetOptions<
  DB,
  TableName extends keyof DB & string,
  SelectedType,
  InsertedType,
  UpdatedType,
  ReturnColumns extends (keyof Selectable<DB[TableName]> & string)[] | ["*"],
  InsertReturnedType,
  UpdateReturnedType
> {
  /** Transformation to apply to selected objects. */
  selectTransform?: (row: Selectable<DB[TableName]>) => SelectedType;

  /** Transformation to apply to inserted objects. */
  insertTransform?: (obj: InsertedType) => Insertable<DB[TableName]>;

  /** Columns to return from table upon insertion. */
  returnColumns?: ReturnColumns;

  /** Transformation to apply to data returned from inserts. */
  insertReturnTransform?: (
    source: InsertedType,
    returns: Partial<Selectable<DB[TableName]>>
  ) => InsertReturnedType;

  /** Transformation to apply to updated objects. */
  updateTransform?: (update: UpdatedType) => Updateable<DB[TableName]>;

  /** Columns to return when updating but not requesting returns. */
  defaultUpdateReturns?: (keyof Selectable<DB[TableName] & string>)[];

  /** Transformation to apply to data returned from updates. */
  updateReturnTransform?: (
    source: UpdatedType,
    returns: Partial<Selectable<DB[TableName]>>
  ) => UpdateReturnedType;
}
