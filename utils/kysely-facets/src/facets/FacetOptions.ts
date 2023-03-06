import { Insertable, Selectable, Updateable } from "kysely";

/**
 * Options governing facet behavior.
 */
export interface FacetOptions<
  DB,
  TableName extends keyof DB & string,
  ST,
  IT,
  UT,
  RT
> {
  /** Transformation to apply to selected objects. */
  selectTransform?: (row: Selectable<DB[TableName]>) => ST;

  /** Transformation to apply to inserted objects. */
  insertTransform?: (obj: IT) => Insertable<DB[TableName]>;

  /** Transformation to apply to updated objects. */
  updateTransform?: (update: UT) => Updateable<DB[TableName]>;

  /** Transformation to apply to data returned from inserts and updates. */
  returnTransform?: (
    source: IT | UT,
    returns: Partial<Selectable<DB[TableName]>>
  ) => RT;
}
