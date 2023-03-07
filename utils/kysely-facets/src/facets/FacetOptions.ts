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
  InsertReturnedType,
  UpdateReturnedType
> {
  /** Transformation to apply to selected objects. */
  selectTransform?: (row: Selectable<DB[TableName]>) => SelectedType;

  /** Transformation to apply to inserted objects. */
  insertTransform?: (obj: InsertedType) => Insertable<DB[TableName]>;

  /** Columns to return when inserting but not requesting returns. */
  defaultInsertReturns?: (keyof Selectable<DB[TableName] & string>)[];

  /** Transformation to apply to data returned from inserts. */
  insertReturnTransform?: (
    source: InsertedType,
    returns: Partial<Selectable<DB[TableName]>>
  ) => InsertReturnedType extends void ? never : InsertReturnedType;

  /** Transformation to apply to updated objects. */
  updateTransform?: (update: UpdatedType) => Updateable<DB[TableName]>;

  /** Columns to return when updating but not requesting returns. */
  defaultUpdateReturns?: (keyof Selectable<DB[TableName] & string>)[];

  /** Transformation to apply to data returned from updates. */
  updateReturnTransform?: (
    source: UpdatedType,
    returns: Partial<Selectable<DB[TableName]>>
  ) => UpdateReturnedType extends void ? never : UpdateReturnedType;
}
