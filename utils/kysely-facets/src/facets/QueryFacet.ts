import {
  Kysely,
  ReferenceExpression,
  SelectExpressionOrList,
  SelectQueryBuilder,
} from "kysely";
import {
  QueryBuilderWithSelection,
  SelectExpression,
  Selection,
} from "kysely/dist/cjs/parser/select-parser";

import { AllSelection } from "../lib/type-utils";
import { applyQueryFilter, QueryFilter } from "../filters/QueryFilter";

type SelectAllQB<DB, TableName extends keyof DB & string> = ReturnType<
  QueryFacet<DB, TableName, any>["selectAllQB"]
>;

/**
 * Options governing QueryFacet behavior.
 */
export interface FacetOptions<
  DB,
  TableName extends keyof DB & string,
  InitialQBOutput,
  SelectedObject
> {
  /** Transformation to apply to selected objects. */
  readonly selectTransform?: (
    row: AllSelection<DB, TableName> & InitialQBOutput
  ) => SelectedObject;
}

/**
 * Base class for all Kysely facets.
 */
export class QueryFacet<
  DB,
  TableName extends keyof DB & string,
  InitialQBOutput,
  SelectedObject = AllSelection<DB, TableName> & InitialQBOutput
> {
  /**
   * Transforms selected rows into the mapped object type.
   * @param row Selected row.
   * @returns Object representation of the row.
   */
  // This lengthy type provides better type assistance messages
  // in VSCode than a dedicated TransformInsertion type would.
  protected transformSelection: NonNullable<
    FacetOptions<
      DB,
      TableName,
      InitialQBOutput,
      SelectedObject
    >["selectTransform"]
  > = (row) => row as SelectedObject;

  /**
   * Creates a new query facet.
   * @param db Kysely database instance.
   * @param tableName Name of the table this facet is for.
   * @param options Options governing facet behavior.
   */
  constructor(
    readonly db: Kysely<DB>,
    readonly initialQB: SelectQueryBuilder<DB, TableName, InitialQBOutput>,
    readonly options: FacetOptions<
      DB,
      TableName,
      InitialQBOutput,
      SelectedObject
    > = {}
  ) {
    if (options.selectTransform) {
      this.transformSelection = options.selectTransform;
    }
  }

  getInitialQBOutput(): InitialQBOutput {
    return {} as any;
  }

  /**
   * Creates a query builder for selecting rows from this table,
   * returning only the requested columns.
   * @param selections Column to return or array of columns to return.
   * @returns A query builder for selecting rows from this table,
   *  returning only the requested column or columns.
   */
  selectQB<SE extends SelectExpressionOrList<DB, TableName>>(
    selections: SE
  ): QueryBuilderWithSelection<DB, TableName, InitialQBOutput, SE> {
    return this.initialQB.select(selections as any);
  }

  /**
   * Creates a query builder for selecting rows from this table,
   * returning all columns.
   * @returns A query builder for selecting rows from this table,
   * returning all columns.
   */
  selectAllQB() {
    return this.initialQB.selectAll();
  }

  /**
   * Selects zero or more rows from this table, selecting rows according
   * to the provided filter.
   * @param filter Filter that constrains the selected rows.
   * @returns An array of objects for the selected rows, possibly empty.
   */
  async selectMany<RE extends ReferenceExpression<DB, TableName>>(
    filter: QueryFilter<
      DB,
      TableName,
      InitialQBOutput,
      SelectAllQB<DB, TableName>,
      RE
    >
  ): Promise<SelectedObject[]> {
    const sqb = this.selectAllQB();
    const fqb = applyQueryFilter(this, filter)(sqb);
    const selections = await fqb.execute();
    return this.transformSelectionArray(
      selections as (AllSelection<DB, TableName> & InitialQBOutput)[]
    );
  }

  /**
   * Selects the first row from this table matching the provided filter.
   * @param filter Filter that constrains the selection.
   * @returns An object for the selected row, or `null` if no row was found.
   */
  async selectOne<RE extends ReferenceExpression<DB, TableName>>(
    filter: QueryFilter<
      DB,
      TableName,
      InitialQBOutput,
      SelectAllQB<DB, TableName>,
      RE
    >
  ): Promise<SelectedObject | null> {
    const sqb = this.selectAllQB();
    const fqb = applyQueryFilter(this, filter)(sqb);
    const selection = await fqb.executeTakeFirst();
    if (!selection) return null;
    return this.transformSelection(
      selection as AllSelection<DB, TableName> & InitialQBOutput
    );
  }

  /**
   * Selects zero or more rows from this table, selecting rows according
   * to the provided filter, returning the given columns.
   * @param filter Filter that constrains the selected rows.
   * @param returnColumns Columns to return. `[]` returns all columns,
   *  as does omitting the argument.
   * @returns An array of the selected rows, possibly empty,
   *  only containing the requested columns.
   */
  subselectMany<RE extends ReferenceExpression<DB, TableName>>(
    filter: QueryFilter<
      DB,
      TableName,
      InitialQBOutput,
      SelectAllQB<DB, TableName>,
      RE
    >
  ): Promise<(AllSelection<DB, TableName> & InitialQBOutput)[]>;

  subselectMany<RE extends ReferenceExpression<DB, TableName>>(
    filter: QueryFilter<
      DB,
      TableName,
      InitialQBOutput,
      SelectAllQB<DB, TableName>,
      RE
    >,
    selections: []
  ): Promise<(AllSelection<DB, TableName> & InitialQBOutput)[]>;

  subselectMany<
    RE extends ReferenceExpression<DB, TableName>,
    SE extends SelectExpression<DB, TableName>
  >(
    filter: QueryFilter<
      DB,
      TableName,
      InitialQBOutput,
      SelectAllQB<DB, TableName>,
      RE
    >,
    selections: ReadonlyArray<SE>
  ): Promise<
    | (AllSelection<DB, TableName> & InitialQBOutput)[]
    | (Selection<DB, TableName, SE> & InitialQBOutput)[]
  >;

  async subselectMany<
    RE extends ReferenceExpression<DB, TableName>,
    SE extends SelectExpression<DB, TableName>
  >(
    filter: QueryFilter<
      DB,
      TableName,
      InitialQBOutput,
      SelectAllQB<DB, TableName>,
      RE
    >,
    selections?: ReadonlyArray<SE>
  ): Promise<
    | (AllSelection<DB, TableName> & InitialQBOutput)[]
    | (Selection<DB, TableName, SE> & InitialQBOutput)[]
  > {
    const sqb =
      !selections || selections.length === 0
        ? this.selectAllQB()
        : this.selectQB(selections as any);
    const fqb = applyQueryFilter(this, filter)(sqb);
    return fqb.execute() as any;
  }

  /**
   * Selects the first row from this table matching the provided filter,
   * returning the given columns.
   * @param filter Filter that constrains the selection.
   * @param returnColumns Columns to return. `[]` returns all columns,
   *  as does omitting the argument.
   * @returns The selected row, only containing the requested columns,
   *  or `null` if no matching row was found.
   */
  subselectOne<RE extends ReferenceExpression<DB, TableName>>(
    filter: QueryFilter<
      DB,
      TableName,
      InitialQBOutput,
      SelectAllQB<DB, TableName>,
      RE
    >
  ): Promise<(AllSelection<DB, TableName> & InitialQBOutput) | null>;

  subselectOne<RE extends ReferenceExpression<DB, TableName>>(
    filter: QueryFilter<
      DB,
      TableName,
      InitialQBOutput,
      SelectAllQB<DB, TableName>,
      RE
    >,
    selections: []
  ): Promise<(AllSelection<DB, TableName> & InitialQBOutput) | null>;

  subselectOne<
    RE extends ReferenceExpression<DB, TableName>,
    SE extends SelectExpression<DB, TableName>
  >(
    filter: QueryFilter<
      DB,
      TableName,
      InitialQBOutput,
      SelectAllQB<DB, TableName>,
      RE
    >,
    selections: ReadonlyArray<SE>
  ): Promise<
    | (AllSelection<DB, TableName> & InitialQBOutput)
    | (Selection<DB, TableName, SE> & InitialQBOutput)
    | null
  >;

  async subselectOne<
    RE extends ReferenceExpression<DB, TableName>,
    SE extends SelectExpression<DB, TableName>
  >(
    filter: QueryFilter<
      DB,
      TableName,
      InitialQBOutput,
      SelectAllQB<DB, TableName>,
      RE
    >,
    selections?: ReadonlyArray<SE>
  ): Promise<
    | (AllSelection<DB, TableName> & InitialQBOutput)
    | (Selection<DB, TableName, SE> & InitialQBOutput)
    | null
  > {
    const sqb =
      !selections || selections.length === 0
        ? this.selectAllQB()
        : this.selectQB(selections as any);
    const fqb = applyQueryFilter(this, filter)(sqb);
    const result = await fqb.executeTakeFirst();
    return result ? (result as any) : null;
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
    source: (AllSelection<DB, TableName> & InitialQBOutput)[]
  ): SelectedObject[] {
    if (this.options.selectTransform) {
      return source.map((obj) => this.transformSelection(obj));
    }
    return source as any;
  }
}
