/**
 * The type and implementation of the query filter object, which can
 * be passed as an argument to query functions to constrain results.
 */

import {
  ComparisonOperatorExpression,
  Expression,
  ExtractTypeFromStringReference,
  OperandValueExpressionOrList,
  ReferenceExpression,
  SelectType,
  WhereInterface,
} from "kysely";

import { QueryFacet } from "../facets/QueryFacet";
import { AppliedFilter } from "./AppliedFilter";

type AnyWhereInterface = WhereInterface<any, any>;

/**
 * Type of the query filter object, which can be passed as an argument
 * to query functions to constrain results.
 */
export type QueryFilter<
  DB,
  TableName extends keyof DB & string,
  QB extends AnyWhereInterface,
  RE extends ReferenceExpression<DB, TableName>
> =
  | BinaryOperationFilter<DB, TableName, RE>
  | FieldMatchingFilter<DB, TableName, RE>
  | QueryBuilderFilter<QB>
  | QueryExpressionFilter
  | AppliedFilter<DB, TableName, QB>;

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
  TableName extends keyof DB & string,
  RE extends ReferenceExpression<DB, TableName>
> = {
  [K in RE & string]?: SelectType<
    ExtractTypeFromStringReference<DB, TableName, K>
  >;
};

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
  QB extends AnyWhereInterface,
  RE extends ReferenceExpression<DB, TableName>
>(
  base: QueryFacet<DB, TableName, any, any>,
  filter: QueryFilter<DB, TableName, QB, RE>
): (qb: AnyWhereInterface) => QB {
  // Process a query builder filter.
  if (typeof filter === "function") {
    return filter as (qb: AnyWhereInterface) => QB;
  }

  if (typeof filter === "object" && filter !== null) {
    // Process a query expression filter. Check for expressions
    // first because they could potentially be plain objects.
    if ("expressionType" in filter) {
      return (qb) => qb.where(filter) as QB;
    }

    // Process a field matching filter. `{}` matches all rows.
    if (filter.constructor === Object) {
      return (qb: AnyWhereInterface) => {
        for (const [column, value] of Object.entries(filter)) {
          qb = qb.where(base.ref(column), "=", value) as QB;
        }
        return qb as QB;
      };
    }

    // Process a binary operation filter.
    if (Array.isArray(filter)) {
      return (qb) => qb.where(...filter) as QB;
    }

    // Process a combination filter.
    if (filter instanceof AppliedFilter) {
      return filter.apply(base) as (qb: AnyWhereInterface) => QB;
    }
  }

  throw Error("Unrecognized query filter");
}
