import { Kysely, ReferenceExpression, Selectable } from "kysely";
import { SelectAllQueryBuilder } from "kysely/dist/cjs/parser/select-parser";

import { applyQueryFilter, QueryFilter } from "../filters/QueryFilter";
import { FilterMaker } from "../filters/FilterMaker";

/**
 * Options governing KyselyFacet behavior.
 */
export interface FacetOptions<
  DB,
  TableName extends keyof DB & string,
  SelectedObject
> {
  /** Transformation to apply to selected objects. */
  readonly selectTransform?: (row: Selectable<DB[TableName]>) => SelectedObject;
}

/**
 * Base class for all Kysely facets.
 */
export class KyselyFacet<
  DB,
  TableName extends keyof DB & string,
  SelectedObject = Selectable<DB[TableName]>
> {
  /**
   * Transforms selected rows into the mapped object type.
   * @param row Selected row.
   * @returns Object representation of the row.
   */
  // This lengthy type provides better type assistance messages
  // in VSCode than a dedicated TransformInsertion type would.
  protected transformSelection: NonNullable<
    FacetOptions<DB, TableName, SelectedObject>["selectTransform"]
  > = (row) => row as SelectedObject;

  /**
   * Creates a new Kysely facet.
   * @param db Kysely database instance.
   * @param tableName Name of the table this facet is for.
   * @param options Options governing facet behavior.
   */
  constructor(
    readonly db: Kysely<DB>,
    readonly tableName: TableName,
    readonly options: FacetOptions<DB, TableName, SelectedObject> = {}
  ) {
    if (options.selectTransform) {
      this.transformSelection = options.selectTransform;
    }
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
   * Selects zero or more rows from this table, selecting rows according
   * to the provided filter.
   * @param filter Filter that constrains the selected rows.
   * @returns An array of objects for the selected rows, possibly empty.
   */
  async selectMany<
    QB extends SelectAllQueryBuilder<DB, TableName, object, TableName>,
    RE extends ReferenceExpression<DB, TableName>
  >(filter: QueryFilter<DB, TableName, QB, RE>): Promise<SelectedObject[]> {
    const sqb = this.selectRows().selectAll();
    const fqb = applyQueryFilter(this, filter)(sqb);
    const selections = await fqb.execute();
    return this.transformSelectionArray(
      selections as Selectable<DB[TableName]>[]
    );
  }

  /**
   * Selects at most one row from this table, selecting rows according
   * to the provided filter.
   * @param filter Filter that constrains the selection.
   * @returns An object for the selected row, or `null` if no row was found.
   */
  async selectOne<
    QB extends SelectAllQueryBuilder<DB, TableName, object, TableName>,
    RE extends ReferenceExpression<DB, TableName>
  >(
    filter: QueryFilter<DB, TableName, QB, RE>
  ): Promise<SelectedObject | null> {
    const sqb = this.selectRows().selectAll();
    const fqb = applyQueryFilter(this, filter)(sqb);
    const selection = await fqb.executeTakeFirst();
    if (!selection) return null;
    return this.transformSelection(selection as Selectable<DB[TableName]>);
  }

  /**
   * Returns a selection filter maker for this facet.
   * @returns A selection filter maker for this facet.
   */
  selectFilterMaker() {
    return new FilterMaker<
      DB,
      TableName,
      // TODO: can I replace SelectedObject with any?
      ReturnType<KyselyFacet<DB, TableName, SelectedObject>["selectRows"]>
    >();
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
   * Transforms a selected array of rows into a returnable array of objects.
   *  A utility for keeping transform code simple and performant.
   */
  protected transformSelectionArray(
    source: Selectable<DB[TableName]>[]
  ): SelectedObject[] {
    if (this.options.selectTransform) {
      // TS isn't seeing that options and the transform are defined.
      return source.map((obj) => this.transformSelection(obj));
    }
    return source as any;
  }
}
