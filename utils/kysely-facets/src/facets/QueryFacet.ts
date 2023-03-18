import {
  Kysely,
  ReferenceExpression,
  SelectExpressionOrList,
  SelectQueryBuilder,
} from "kysely";
import {
  SelectExpression,
  Selection,
} from "kysely/dist/cjs/parser/select-parser";

import {
  AliasNames,
  AllColumns,
  ColumnAlias,
  EmptyObject,
} from "../lib/type-utils";
import { applyQueryFilter, QueryFilter } from "../filters/QueryFilter";

/**
 * Query result row type returning all possible columns, including
 * configured column aliases, unless `InitialQBOutput` is specified,
 * in which case it returns that type.
 */
type InitialQBOutputOrAll<
  DB,
  TableName extends keyof DB & string,
  InitialQBOutput,
  SelectColumnAliases extends string[]
> = InitialQBOutput extends EmptyObject
  ? AllColumns<DB, TableName, SelectColumnAliases>
  : InitialQBOutput;

/**
 * Query builder type that selects all possible columns, including
 * configured column aliases, unless `InitialQBOutput` is specified,
 * it selects just that type.
 */
type SelectAllQB<
  DB,
  TableName extends keyof DB & string,
  InitialQBOutput,
  SelectColumnAliases extends string[]
> = SelectQueryBuilder<
  DB,
  TableName,
  InitialQBOutputOrAll<DB, TableName, InitialQBOutput, SelectColumnAliases>
>;

/**
 * Options governing QueryFacet behavior.
 */
export interface FacetOptions<
  DB,
  TableName extends keyof DB & string,
  InitialQBOutput,
  SelectColumnAliases extends ColumnAlias<DB, TableName>[] = [],
  SelectedObject = InitialQBOutputOrAll<
    DB,
    TableName,
    InitialQBOutput,
    SelectColumnAliases
  >
> {
  /**
   * Column aliases to with selections, except when the caller explicitly
   * specifies selections via subselect. Each alias is a string of the form
   * `column-or-column-reference as alias`.
   */
  readonly columnAliases?: SelectColumnAliases;

  /** Transformation to apply to selected objects. */
  readonly selectTransform?: (
    row: InitialQBOutputOrAll<
      DB,
      TableName,
      InitialQBOutput,
      SelectColumnAliases
    >
  ) => SelectedObject;
}

/**
 * Base class for all Kysely facets.
 */
export class QueryFacet<
  DB,
  TableName extends keyof DB & string,
  InitialQBOutput,
  SelectColumnAliases extends ColumnAlias<DB, TableName>[] = [],
  SelectedObject = InitialQBOutputOrAll<
    DB,
    TableName,
    InitialQBOutput,
    SelectColumnAliases
  >
> {
  /**
   * Column aliases to use with `selectOne()` and `selectMany()`.
   */
  protected readonly columnAliases: SelectColumnAliases;

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
      SelectColumnAliases,
      SelectedObject
    >["selectTransform"]
  > = (row) => row as SelectedObject;

  // Maps alias names to the alias expressions that define them.
  readonly #aliasMap: Record<string, string> = {};

  // Whether initial query builder includes selections.
  readonly #hasInitialSelections: boolean;

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
      SelectColumnAliases,
      SelectedObject
    > = {}
  ) {
    this.columnAliases = options.columnAliases || ([] as any);
    for (const alias of this.columnAliases) {
      const [_, name] = alias.split(" as ");
      this.#aliasMap[name] = alias;
    }

    this.#hasInitialSelections = !!initialQB.toOperationNode().selections;

    if (options.selectTransform) {
      this.transformSelection = options.selectTransform;
    }
  }

  /**
   * Creates a query builder for selecting rows from this table,
   * returning only the requested columns. Disregardes any columns
   * originally selected.
   * @param selections Column to return or array of columns to return.
   * @returns A query builder for selecting rows from this table,
   *  returning only the requested column or columns.
   */
  selectQB<SEL extends SelectExpressionOrList<DB, TableName>>(selections: SEL) {
    // clearSelect() clears a clone of the query builder
    return this.initialQB.clearSelect().select(selections as any);
  }

  /**
   * Creates a query builder for selecting rows from this table, returning
   * all columns, including the aliases of `SelectColumnAliases`.
   * @returns A query builder for selecting rows from this table.
   */
  selectAllQB() {
    return this.#hasInitialSelections
      ? this.initialQB
      : this.columnAliases.length == 0
      ? this.initialQB.selectAll()
      : this.initialQB.selectAll().select(this.columnAliases);
  }

  /**
   * Selects zero or more rows from this table, selecting rows according
   * to the provided filter. The rows include all columns, including the
   * aliases of `SelectColumnAliases`.
   * @param filter Filter that constrains the selected rows.
   * @returns An array of objects for the selected rows, possibly empty.
   */
  async selectMany<RE extends ReferenceExpression<DB, TableName>>(
    filter: QueryFilter<
      DB,
      TableName,
      SelectAllQB<DB, TableName, InitialQBOutput, SelectColumnAliases>,
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
   * The row includes all columns, including the aliases of `SelectColumnAliases`.
   * @param filter Filter that constrains the selection.
   * @returns An object for the selected row, or `null` if no row was found.
   */
  async selectOne<RE extends ReferenceExpression<DB, TableName>>(
    filter: QueryFilter<
      DB,
      TableName,
      SelectAllQB<DB, TableName, InitialQBOutput, SelectColumnAliases>,
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
   *  including the aliases of `SelectColumnAliases`, as does omitting the argument.
   * @returns An array of the selected rows, possibly empty,
   *  only containing the requested columns.
   */
  subselectMany<RE extends ReferenceExpression<DB, TableName>>(
    filter: QueryFilter<
      DB,
      TableName,
      SelectAllQB<DB, TableName, InitialQBOutput, SelectColumnAliases>,
      RE
    >
  ): Promise<
    InitialQBOutputOrAll<DB, TableName, InitialQBOutput, SelectColumnAliases>[]
  >;

  subselectMany<RE extends ReferenceExpression<DB, TableName>>(
    filter: QueryFilter<
      DB,
      TableName,
      SelectAllQB<DB, TableName, InitialQBOutput, SelectColumnAliases>,
      RE
    >,
    selections: []
  ): Promise<
    InitialQBOutputOrAll<DB, TableName, InitialQBOutput, SelectColumnAliases>[]
  >;

  subselectMany<
    RE extends ReferenceExpression<DB, TableName>,
    SE extends
      | (keyof InitialQBOutput & string)
      | SelectExpression<DB, TableName>
      | AliasNames<SelectColumnAliases>
  >(
    filter: QueryFilter<
      DB,
      TableName,
      SelectAllQB<DB, TableName, InitialQBOutput, SelectColumnAliases>,
      RE
    >,
    selections: ReadonlyArray<SE>
  ): Promise<Selection<DB, TableName, SE>[]>;

  async subselectMany<
    RE extends ReferenceExpression<DB, TableName>,
    SE extends
      | (keyof InitialQBOutput & string)
      | SelectExpression<DB, TableName>
      | AliasNames<SelectColumnAliases>
  >(
    filter: QueryFilter<
      DB,
      TableName,
      SelectAllQB<DB, TableName, InitialQBOutput, SelectColumnAliases>,
      RE
    >,
    selections?: ReadonlyArray<SE>
  ): Promise<
    | InitialQBOutputOrAll<
        DB,
        TableName,
        InitialQBOutput,
        SelectColumnAliases
      >[]
    | Selection<DB, TableName, SE>[]
  > {
    const sqb = this.createSubselectQB(selections);
    const fqb = applyQueryFilter(this, filter)(sqb);
    return fqb.execute() as any;
  }

  /**
   * Selects the first row from this table matching the provided filter,
   * returning the given columns.
   * @param filter Filter that constrains the selection.
   * @param returnColumns Columns to return. `[]` returns all columns,
   *  including the aliases of `SelectColumnAliases`, as does omitting the argument.
   * @returns The selected row, only containing the requested columns,
   *  or `null` if no matching row was found.
   */
  subselectOne<RE extends ReferenceExpression<DB, TableName>>(
    filter: QueryFilter<
      DB,
      TableName,
      SelectAllQB<DB, TableName, InitialQBOutput, SelectColumnAliases>,
      RE
    >
  ): Promise<InitialQBOutputOrAll<
    DB,
    TableName,
    InitialQBOutput,
    SelectColumnAliases
  > | null>;

  subselectOne<RE extends ReferenceExpression<DB, TableName>>(
    filter: QueryFilter<
      DB,
      TableName,
      SelectAllQB<DB, TableName, InitialQBOutput, SelectColumnAliases>,
      RE
    >,
    selections: []
  ): Promise<InitialQBOutputOrAll<
    DB,
    TableName,
    InitialQBOutput,
    SelectColumnAliases
  > | null>;

  subselectOne<
    RE extends ReferenceExpression<DB, TableName>,
    SE extends
      | (keyof InitialQBOutput & string)
      | SelectExpression<DB, TableName>
      | AliasNames<SelectColumnAliases>
  >(
    filter: QueryFilter<
      DB,
      TableName,
      SelectAllQB<DB, TableName, InitialQBOutput, SelectColumnAliases>,
      RE
    >,
    selections: ReadonlyArray<SE>
  ): Promise<Selection<DB, TableName, SE> | null>;

  async subselectOne<
    RE extends ReferenceExpression<DB, TableName>,
    SE extends
      | (keyof InitialQBOutput & string)
      | SelectExpression<DB, TableName>
      | AliasNames<SelectColumnAliases>
  >(
    filter: QueryFilter<
      DB,
      TableName,
      SelectAllQB<DB, TableName, InitialQBOutput, SelectColumnAliases>,
      RE
    >,
    selections?: ReadonlyArray<SE>
  ): Promise<
    | InitialQBOutputOrAll<DB, TableName, InitialQBOutput, SelectColumnAliases>
    | Selection<DB, TableName, SE>
    | null
  > {
    const sqb = this.createSubselectQB(selections);
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
      SelectColumnAliases
    >[]
  ): SelectedObject[] {
    if (this.options.selectTransform) {
      return source.map((obj) => this.transformSelection(obj));
    }
    return source as any;
  }

  /**
   * Returns a subselect query builder that uses the provided selections.
   */
  protected createSubselectQB<
    SE extends
      | (keyof InitialQBOutput & string)
      | SelectExpression<DB, TableName>
      | AliasNames<SelectColumnAliases>
  >(selections?: ReadonlyArray<SE>) {
    return !selections || selections.length === 0
      ? this.selectAllQB()
      : this.selectQB(
          selections.map((s) => this.#aliasMap[s as string] || s) as any
        );
  }
}
