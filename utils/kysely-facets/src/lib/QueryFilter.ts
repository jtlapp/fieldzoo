/**
 * The type and implementation of the query filter object, which can
 * be passed as an argument to query functions to constrain results.
 */

import {
  ComparisonOperatorExpression,
  Expression,
  OperandValueExpressionOrList,
  ReferenceExpression,
  Updateable,
  WhereInterface,
} from "kysely";

import { KyselyFacet } from "../facets/KyselyFacet";

/**
 * Type of the query filter object, which can be passed as an argument
 * to query functions to constrain results.
 */
export type QueryFilter<
  DB,
  TableName extends keyof DB & string,
  QB extends WhereInterface<DB, TableName>,
  RE extends ReferenceExpression<DB, TableName>
> =
  | BinaryOperationFilter<DB, TableName, RE>
  | FieldMatchingFilter<DB, TableName>
  | QueryBuilderFilter<QB>
  | QueryExpressionFilter
  | MatchAll
  | MatchAny;

/**
 * A filter that is a binary operation, such as `eq` or `gt`.
 */
export type BinaryOperationFilter<
  DB,
  TableName extends keyof DB & string,
  RE extends ReferenceExpression<DB, TableName>
> = [
  lhs: RE,
  op: ComparisonOperatorExpression,
  rhs: OperandValueExpressionOrList<DB, TableName, RE>
];

/**
 * A filter that matches columns against the fields of an object.
 */
export type FieldMatchingFilter<
  DB,
  TableName extends keyof DB & string
> = Updateable<DB[TableName]>;

/**
 * A filter that is a function that takes a query builder and returns
 * a query builder.
 */
export type QueryBuilderFilter<QB> = (qb: QB) => QB;

/**
 * A filter that is a Kysely expression.
 */
export type QueryExpressionFilter = Expression<any>;

/**
 * A filter that is a combination of other filters.
 */
export abstract class ComboFilter {
  filters: QueryFilter<any, any, any, any>[];

  /**
   * Constructs a combo filter.
   * @param filters The filters to combine, listed as separate arguments.
   */
  constructor(...filters: QueryFilter<any, any, any, any>[]) {
    if (filters.length == 0) {
      throw new Error("No filters provided");
    }
    this.filters = filters;
  }

  /**
   * Applies this filter to a query builder.
   * @param base The facet that this filter is applied to.
   * @param qb The query builder to apply the filter to.
   * @returns A function that takes a query builder and returns a query
   *    builder that is constrained according to this filter.
   */
  abstract apply<
    DB,
    TableName extends keyof DB & string,
    QB extends WhereInterface<DB, TableName>
  >(base: KyselyFacet<DB, TableName>, qb: QB): (qb: QB) => QB;
}

/**
 * A filter that matches all of the provided filters.
 */
export class MatchAll extends ComboFilter {
  apply<
    DB,
    TableName extends keyof DB & string,
    QB extends WhereInterface<DB, TableName>
  >(base: KyselyFacet<DB, TableName>): (qb: QB) => QB {
    return (qb) => {
      for (const filter of this.filters) {
        qb = applyQueryFilter(base, filter)(qb);
      }
      return qb;
    };
  }
}

/**
 * A filter that matches at least one of the provided filters.
 */
export class MatchAny extends ComboFilter {
  apply<
    DB,
    TableName extends keyof DB & string,
    QB extends WhereInterface<DB, TableName>
  >(base: KyselyFacet<DB, TableName>): (qb: QB) => QB {
    return (qb) => {
      for (const filter of this.filters) {
        qb = qb.orWhere((qb) => applyQueryFilter(base, filter)(qb)) as QB;
      }
      return qb;
    };
  }
}

/**
 * Returns a query builder that constrains the provided query builder
 * according to the provided query filter.
 * @param base The Kysely facet that is used to create references.
 * @param filter The query filter.
 * @returns A function that takes a query builder and returns a query
 * builder that is constrained according to the provided query filter.
 */
export function applyQueryFilter<
  DB,
  TableName extends keyof DB & string,
  QB extends WhereInterface<DB, TableName>,
  RE extends ReferenceExpression<DB, TableName>
>(
  base: KyselyFacet<DB, TableName>,
  filter: QueryFilter<DB, TableName, QB, RE>
): (qb: QB) => QB {
  // Process a query builder filter.
  if (typeof filter === "function") {
    return filter;
  }

  if (typeof filter === "object" && filter !== null) {
    // Process a query expression filter. Check for expressions
    // first because they could potentially be plain objects.
    if ("expressionType" in filter) {
      return (qb) => qb.where(filter) as QB;
    }

    // Process a field matching filter. `{}` matches all rows.
    if (filter.constructor === Object) {
      return (qb) => {
        for (const [column, value] of Object.entries(filter)) {
          qb = qb.where(base.ref(column), "=", value) as QB;
        }
        return qb;
      };
    }

    // Process a binary operation filter.
    if (Array.isArray(filter)) {
      return (qb) => qb.where(...filter) as QB;
    }

    // Process a combination filter.
    if (filter instanceof ComboFilter) {
      return filter.apply(base);
    }
  }

  throw new Error("Unrecognized query filter");
}
