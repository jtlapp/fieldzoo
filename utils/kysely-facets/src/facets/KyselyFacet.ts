import { Kysely, Selectable } from "kysely";

import { SelectTransform } from "../lib/type-utils";

// TODO: move options to appropriate subclasses

/**
 * Base class for all Kysely facets.
 */
export class KyselyFacet<
  DB,
  TableName extends keyof DB & string,
  SelectedObject = Selectable<DB[TableName]>
> {
  /** Transformation to apply to selected objects. */
  readonly selectTransform?: SelectTransform<DB, TableName, SelectedObject>;

  constructor(
    readonly db: Kysely<DB>,
    readonly tableName: TableName,
    selectTransform?: SelectTransform<DB, TableName, SelectedObject>
  ) {
    this.selectTransform = selectTransform;
  }

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
   * Transforms a selected row or array of rows into a returnable
   * object or array of objects.
   */
  protected transformSelection(
    source: Selectable<DB[TableName]>
  ): SelectedObject;
  protected transformSelection(
    source: Selectable<DB[TableName]>[]
  ): SelectedObject[];
  protected transformSelection(
    source: Selectable<DB[TableName]> | Selectable<DB[TableName]>[]
  ): SelectedObject | SelectedObject[] {
    if (this.selectTransform) {
      if (Array.isArray(source)) {
        // TS isn't seeing that options and the transform are defined.
        return source.map((obj) => this.selectTransform!(obj));
      }
      return this.selectTransform(source);
    }
    return source as any;
  }
}
