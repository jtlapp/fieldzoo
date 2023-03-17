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

import { AllColumns, ColumnAlias, EmptyObject } from "../lib/type-utils";
import { applyQueryFilter, QueryFilter } from "../filters/QueryFilter";

/**
 * Query result row type returning all possible columns, unless
 * `InitialQBOutput` is specified, in which case it returns that type.
 */
export type InitialQBOutputOrAll<
  DB,
  TableName extends keyof DB & string,
  InitialQBOutput,
  ColumnAliases extends string[]
> = InitialQBOutput extends EmptyObject
  ? AllColumns<DB, TableName, ColumnAliases>
  : InitialQBOutput;

type SelectAllQB<
  DB,
  TableName extends keyof DB & string,
  InitialQBOutput,
  ColumnAliases extends string[]
> = SelectQueryBuilder<
  DB,
  TableName,
  InitialQBOutputOrAll<DB, TableName, InitialQBOutput, ColumnAliases>
>;

/**
 * Options governing QueryFacet behavior.
 */
export interface FacetOptions<
  DB,
  TableName extends keyof DB & string,
  InitialQBOutput,
  ColumnAliases extends ColumnAlias<DB, TableName>[] = [],
  SelectedObject = InitialQBOutputOrAll<
    DB,
    TableName,
    InitialQBOutput,
    ColumnAliases
  >
> {
  /**
   * Column aliases to with selections, except when the caller explicitly
   * specifies selections via subselect. Each alias is a string of the form
   * `column-or-column-reference as alias`.
   */
  readonly columnAliases?: ColumnAliases;

  /** Transformation to apply to selected objects. */
  readonly selectTransform?: (
    row: InitialQBOutputOrAll<DB, TableName, InitialQBOutput, ColumnAliases>
  ) => SelectedObject;
}

/**
 * Base class for all Kysely facets.
 */
export class QueryFacet<
  DB,
  TableName extends keyof DB & string,
  InitialQBOutput,
  ColumnAliases extends ColumnAlias<DB, TableName>[] = [],
  SelectedObject = InitialQBOutputOrAll<
    DB,
    TableName,
    InitialQBOutput,
    ColumnAliases
  >
> {
  /**
   * Column aliases to use with `selectOne()` and `selectMany()`.
   */
  protected readonly columnAliases: ColumnAliases;

  /**
   * Transforms selected rows into the mapped object type.
   * @param row Selected row.
   * @returns Object representation of the row.
   */
  // This lengthy type provides better type assistance messages
  // in VSCode than a dedicated TransformInsertion type would.
  protected readonly transformSelection: NonNullable<
    FacetOptions<
      DB,
      TableName,
      InitialQBOutput,
      ColumnAliases,
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
      ColumnAliases,
      SelectedObject
    > = {}
  ) {
    this.columnAliases = options.columnAliases || ([] as any);
    if (options.selectTransform) {
      this.transformSelection = options.selectTransform;
    }
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
   * Creates a query builder for selecting rows from this table, returning
   * all columns, including the aliases of `ColumnAliases`.
   * @returns A query builder for selecting rows from this table.
   */
  selectAllQB() {
    return this.columnAliases.length == 0
      ? this.initialQB.selectAll()
      : this.initialQB.selectAll().select(this.columnAliases);
  }

  /**
   * Selects zero or more rows from this table, selecting rows according
   * to the provided filter. The rows include all columns, including the
   * aliases of `ColumnAliases`.
   * @param filter Filter that constrains the selected rows.
   * @returns An array of objects for the selected rows, possibly empty.
   */
  async selectMany<RE extends ReferenceExpression<DB, TableName>>(
    filter: QueryFilter<
      DB,
      TableName,
      SelectAllQB<DB, TableName, InitialQBOutput, ColumnAliases>,
      RE
    >
  ): Promise<SelectedObject[]> {
    const sqb = this.selectAllQB();
    const fqb = applyQueryFilter(this, filter)(sqb);
    const selections = await fqb.execute();
    return this.transformSelectionArray(selections as any);
  }

  /**
   * Selects the first row from this table matching the provided filter.
   * The row includes all columns, including the aliases of `ColumnAliases`.
   * @param filter Filter that constrains the selection.
   * @returns An object for the selected row, or `null` if no row was found.
   */
  async selectOne<RE extends ReferenceExpression<DB, TableName>>(
    filter: QueryFilter<
      DB,
      TableName,
      SelectAllQB<DB, TableName, InitialQBOutput, ColumnAliases>,
      RE
    >
  ): Promise<SelectedObject | null> {
    const sqb = this.selectAllQB();
    const fqb = applyQueryFilter(this, filter)(sqb);
    const selection = await fqb.executeTakeFirst();
    if (!selection) return null;
    return this.transformSelection(selection as any);
  }

  /**
   * Selects zero or more rows from this table, selecting rows according to
   * the provided filter, returning the given columns.
   * @param filter Filter that constrains the selected rows.
   * @param returnColumns Columns to return. `[]` returns all columns,
   *  including the aliases of `ColumnAliases`, as does omitting the argument.
   * @returns An array of the selected rows, possibly empty,
   *  only containing the requested columns.
   */
  subselectMany<RE extends ReferenceExpression<DB, TableName>>(
    filter: QueryFilter<
      DB,
      TableName,
      SelectAllQB<DB, TableName, InitialQBOutput, ColumnAliases>,
      RE
    >
  ): Promise<
    InitialQBOutputOrAll<DB, TableName, InitialQBOutput, ColumnAliases>[]
  >;

  subselectMany<RE extends ReferenceExpression<DB, TableName>>(
    filter: QueryFilter<
      DB,
      TableName,
      SelectAllQB<DB, TableName, InitialQBOutput, ColumnAliases>,
      RE
    >,
    selections: []
  ): Promise<
    InitialQBOutputOrAll<DB, TableName, InitialQBOutput, ColumnAliases>[]
  >;

  subselectMany<
    RE extends ReferenceExpression<DB, TableName>,
    SE extends SelectExpression<DB, TableName>
  >(
    filter: QueryFilter<
      DB,
      TableName,
      SelectAllQB<DB, TableName, InitialQBOutput, ColumnAliases>,
      RE
    >,
    selections: ReadonlyArray<SE>
  ): Promise<Selection<DB, TableName, SE>[]>;

  async subselectMany<
    RE extends ReferenceExpression<DB, TableName>,
    SE extends SelectExpression<DB, TableName>
  >(
    filter: QueryFilter<
      DB,
      TableName,
      SelectAllQB<DB, TableName, InitialQBOutput, ColumnAliases>,
      RE
    >,
    selections?: ReadonlyArray<SE>
  ): Promise<
    | InitialQBOutputOrAll<DB, TableName, InitialQBOutput, ColumnAliases>[]
    | Selection<DB, TableName, SE>[]
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
   *  including the aliases of `ColumnAliases`, as does omitting the argument.
   * @returns The selected row, only containing the requested columns,
   *  or `null` if no matching row was found.
   */
  subselectOne<RE extends ReferenceExpression<DB, TableName>>(
    filter: QueryFilter<
      DB,
      TableName,
      SelectAllQB<DB, TableName, InitialQBOutput, ColumnAliases>,
      RE
    >
  ): Promise<InitialQBOutputOrAll<
    DB,
    TableName,
    InitialQBOutput,
    ColumnAliases
  > | null>;

  subselectOne<RE extends ReferenceExpression<DB, TableName>>(
    filter: QueryFilter<
      DB,
      TableName,
      SelectAllQB<DB, TableName, InitialQBOutput, ColumnAliases>,
      RE
    >,
    selections: []
  ): Promise<InitialQBOutputOrAll<
    DB,
    TableName,
    InitialQBOutput,
    ColumnAliases
  > | null>;

  subselectOne<
    RE extends ReferenceExpression<DB, TableName>,
    SE extends SelectExpression<DB, TableName>
  >(
    filter: QueryFilter<
      DB,
      TableName,
      SelectAllQB<DB, TableName, InitialQBOutput, ColumnAliases>,
      RE
    >,
    selections: ReadonlyArray<SE>
  ): Promise<Selection<DB, TableName, SE> | null>;

  async subselectOne<
    RE extends ReferenceExpression<DB, TableName>,
    SE extends SelectExpression<DB, TableName>
  >(
    filter: QueryFilter<
      DB,
      TableName,
      SelectAllQB<DB, TableName, InitialQBOutput, ColumnAliases>,
      RE
    >,
    selections?: ReadonlyArray<SE>
  ): Promise<
    | InitialQBOutputOrAll<DB, TableName, InitialQBOutput, ColumnAliases>
    | Selection<DB, TableName, SE>
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
    source: InitialQBOutputOrAll<
      DB,
      TableName,
      InitialQBOutput,
      ColumnAliases
    >[]
  ): SelectedObject[] {
    if (this.options.selectTransform) {
      return source.map((obj) => this.transformSelection(obj));
    }
    return source as any;
  }
}
