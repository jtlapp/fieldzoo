/**
 * The type and implementation of the query filter object, which can
 * be passed as an argument to query functions to constrain results.
 */

import {
  ComparisonOperatorExpression,
  Expression,
  OperandValueExpressionOrList,
  ReferenceExpression,
  UpdateQueryBuilder,
} from "kysely";
import { SelectAllQueryBuilder } from "kysely/dist/cjs/parser/select-parser";

/**
 * Type of the query filter object, which can be passed as an argument
 * to query functions to constrain results.
 */
export type QueryFilter<
  DB,
  TableName extends keyof DB & string,
  QB extends
    | SelectAllQueryBuilder<DB, TableName, object, TableName>
    | UpdateQueryBuilder<DB, TableName, TableName, object>,
  RE extends ReferenceExpression<DB, TableName>
> =
  | QueryBuilderFilter<QB>
  | BinaryOperationFilter<DB, TableName, RE>
  | QueryExpressionFilter;

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
 * with the provided filter.
 */
export function constrainQueryBuilder<
  DB,
  TableName extends keyof DB & string,
  QB extends SelectAllQueryBuilder<DB, TableName, object, TableName>,
  RE extends ReferenceExpression<DB, TableName>
>(filter: QueryFilter<DB, TableName, QB, RE>): (qb: QB) => QB;

export function constrainQueryBuilder<
  DB,
  TableName extends keyof DB & string,
  QB extends UpdateQueryBuilder<DB, TableName, TableName, object>,
  RE extends ReferenceExpression<DB, TableName>
>(filter: QueryFilter<DB, TableName, QB, RE>): (qb: QB) => QB;

export function constrainQueryBuilder<
  DB,
  TableName extends keyof DB & string,
  QB extends
    | SelectAllQueryBuilder<DB, TableName, object, TableName>
    | UpdateQueryBuilder<DB, TableName, TableName, object>,
  RE extends ReferenceExpression<DB, TableName>
>(filter: QueryFilter<DB, TableName, QB, RE>): (qb: QB) => QB {
  // Process a binary operation filter.
  if (Array.isArray(filter)) {
    return (qb) => (qb.where as any)(...filter);
  }

  // Process a query builder filter.
  if (typeof filter === "function") {
    return filter;
  }

  // Process a query expression filter.
  return (qb: QB) => (qb.where as any)(filter);
}
