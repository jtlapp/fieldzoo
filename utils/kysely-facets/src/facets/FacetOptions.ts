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
  ReturnedType
> {
  /** Transformation to apply to selected objects. */
  selectTransform?: (row: Selectable<DB[TableName]>) => SelectedType;

  /** Transformation to apply to inserted objects. */
  insertTransform?: (obj: InsertedType) => Insertable<DB[TableName]>;

  /** Transformation to apply to updated objects. */
  updateTransform?: (update: UpdatedType) => Updateable<DB[TableName]>;

  /** Transformation to apply to data returned from inserts and updates. */
  returnTransform?: (
    source: InsertedType | UpdatedType,
    returns: Partial<Selectable<DB[TableName]>>
  ) => ReturnedType;
}
