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
import { AppliedFilter } from "./AppliedFilter";

type AnyWhere = WhereInterface<any, any>;

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
  | AppliedFilter;

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
  FQB extends AnyWhere,
  RE extends ReferenceExpression<DB, TableName>
>(
  base: KyselyFacet<DB, TableName, any>,
  filter: QueryFilter<DB, TableName, FQB, RE>
): <QB extends AnyWhere>(qb: QB) => FQB {
  // Process a query builder filter.
  if (typeof filter === "function") {
    return filter as (qb: AnyWhere) => FQB;
  }

  if (typeof filter === "object" && filter !== null) {
    // Process a query expression filter. Check for expressions
    // first because they could potentially be plain objects.
    if ("expressionType" in filter) {
      return (qb) => qb.where(filter) as FQB;
    }

    // Process a field matching filter. `{}` matches all rows.
    if (filter.constructor === Object) {
      return (qb: AnyWhere) => {
        for (const [column, value] of Object.entries(filter)) {
          qb = qb.where(base.ref(column), "=", value);
        }
        return qb as FQB;
      };
    }

    // Process a binary operation filter.
    if (Array.isArray(filter)) {
      return (qb) => qb.where(...filter) as FQB;
    }

    // Process a combination filter.
    if (filter instanceof AppliedFilter) {
      return filter.apply(base) as (qb: AnyWhere) => FQB;
    }
  }

  throw Error("Unrecognized query filter");
}
