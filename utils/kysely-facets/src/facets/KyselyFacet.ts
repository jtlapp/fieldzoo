import { Insertable, Kysely, Selectable, Updateable } from "kysely";

import { FacetOptions } from "./FacetOptions";
import { ObjectWithKeys } from "../lib/type-utils";

// TODO: never call takeFirstOrThrow() -- poor error, no source given
// TODO: move options to appropriate subclasses

/**
 * Base class for all Kysely facets.
 */
export class KyselyFacet<
  DB,
  TableName extends keyof DB & string,
  SelectedType = Selectable<DB[TableName]>,
  InsertedType = Insertable<DB[TableName]>,
  UpdatedType = Partial<InsertedType>,
  ReturnColumns extends
    | (keyof Selectable<DB[TableName]> & string)[]
    | ["*"] = [],
  InsertReturnedType = ReturnColumns extends []
    ? void
    : ReturnColumns extends ["*"]
    ? Selectable<DB[TableName]>
    : ObjectWithKeys<Selectable<DB[TableName]>, ReturnColumns>,
  UpdateReturnedType = ReturnColumns extends []
    ? void
    : ReturnColumns extends ["*"]
    ? Selectable<DB[TableName]>
    : ObjectWithKeys<Selectable<DB[TableName]>, ReturnColumns>
> {
  constructor(
    readonly db: Kysely<DB>,
    readonly tableName: TableName,
    readonly options?: FacetOptions<
      DB,
      TableName,
      SelectedType,
      InsertedType,
      UpdatedType,
      ReturnColumns,
      InsertReturnedType,
      UpdateReturnedType
    >
  ) {}

  /**
   * Creates a query builder for inserting rows into this table.
   * @returns A query builder for inserting rows into this table.
   */
  insertRows() {
    return this.db.insertInto(this.tableName);
  }

  /**
   * Creates a query builder for updating rows in this table.
   * @returns A query builder for updating rows in this table.
   */
  updateRows() {
    return this.db.updateTable(this.tableName);
  }

  /**
   * Creates a query builder for selecting rows from this table.
   * @returns A query builder for selecting rows from this table.
   */
  selectRows() {
    return this.db.selectFrom(this.tableName).selectAll();
  }

  /**
   * Creates a query builder for deleting rows from this table.
   * @returns A query builder for deleting rows from this table.
   */
  deleteRows() {
    return this.db.deleteFrom(this.tableName);
  }

  /**
   * Returns a reference to a column, which can be a generated string.
   * @param column The column name being referenced.
   * @returns A reference to the given column.
   */
  ref(column: string) {
    return this.db.dynamic.ref(column);
  }

  /**
   * Transforms an object or array of objects received for insertion into
   * an insertable row or array of rows.
   */
  protected transformInsertion(source: InsertedType): Insertable<DB[TableName]>;
  protected transformInsertion(
    source: InsertedType[]
  ): Insertable<DB[TableName]>[];
  protected transformInsertion(
    source: InsertedType | InsertedType[]
  ): Insertable<DB[TableName]> | Insertable<DB[TableName]>[] {
    if (this.options?.insertTransform) {
      if (Array.isArray(source)) {
        // TS isn't seeing that options and the transform are defined.
        return source.map((obj) => this.options!.insertTransform!(obj));
      }
      return this.options.insertTransform(source);
    }
    return source as any;
  }

  /**
   * Transforms an object or an array of objects returned from an insert
   * into a returnable object or an array of objects.
   */
  protected transformInsertReturn(
    source: InsertedType,
    returns: Partial<Selectable<DB[TableName]>>
  ): InsertReturnedType;
  protected transformInsertReturn(
    source: InsertedType[],
    returns: Partial<Selectable<DB[TableName]>>[]
  ): InsertReturnedType[];
  protected transformInsertReturn(
    source: InsertedType | InsertedType[],
    returns:
      | Partial<Selectable<DB[TableName]>>
      | Partial<Selectable<DB[TableName]>>[]
  ): InsertReturnedType | InsertReturnedType[] {
    if (this.options?.insertReturnTransform) {
      if (Array.isArray(source)) {
        if (!Array.isArray(returns)) {
          throw Error("Expected returns to be an array");
        }
        // TS isn't seeing that options and the transform are defined.
        return source.map((obj, i) =>
          this.options!.insertReturnTransform!(obj, returns[i])
        );
      }
      if (Array.isArray(returns)) {
        throw Error("Expected returns to be a single object");
      }
      return this.options.insertReturnTransform(source, returns);
    }
    return returns as any;
  }

  /**
   * Transforms an object or an array of objects returned from an update
   * into a returnable object or an array of objects.
   */
  protected transformUpdateReturn(
    source: UpdatedType,
    returns: Partial<Selectable<DB[TableName]>>[]
  ): UpdateReturnedType[] {
    if (this.options?.updateReturnTransform) {
      // TS isn't seeing that options and the transform are defined.
      return returns.map((returnValues) =>
        this.options!.updateReturnTransform!(source, returnValues)
      );
    }
    return returns as any;
  }

  /**
   * Transforms a selected row or array of rows into a returnable
   * object or array of objects.
   */
  protected transformSelection(source: Selectable<DB[TableName]>): SelectedType;
  protected transformSelection(
    source: Selectable<DB[TableName]>[]
  ): SelectedType[];
  protected transformSelection(
    source: Selectable<DB[TableName]> | Selectable<DB[TableName]>[]
  ): SelectedType | SelectedType[] {
    if (this.options?.selectTransform) {
      if (Array.isArray(source)) {
        // TS isn't seeing that options and the transform are defined.
        return source.map((obj) => this.options!.selectTransform!(obj));
      }
      return this.options.selectTransform(source);
    }
    return source as any;
  }

  /**
   * Transforms an object or array of objects received for update into
   * an updateable row or array of rows.
   */
  // TODO: Might not need to support arrays here.
  protected transformUpdate(source: UpdatedType): Updateable<DB[TableName]>;
  protected transformUpdate(source: UpdatedType[]): Updateable<DB[TableName]>[];
  protected transformUpdate(
    source: UpdatedType | UpdatedType[]
  ): Updateable<DB[TableName]> | Updateable<DB[TableName]>[] {
    if (this.options?.updateTransform) {
      if (Array.isArray(source)) {
        // TS isn't seeing that options and the transform are defined.
        return source.map((obj) => this.options!.updateTransform!(obj));
      }
      return this.options.updateTransform(source);
    }
    return source as any;
  }
}
