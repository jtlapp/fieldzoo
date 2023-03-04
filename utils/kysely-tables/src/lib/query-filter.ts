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
  UpdateQueryBuilder,
} from "kysely";
import { SelectAllQueryBuilder } from "kysely/dist/cjs/parser/select-parser";

import { BaseKyselyFacet } from "./BaseKyselyFacet";

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
  | BinaryOperationFilter<DB, TableName, RE>
  | FieldMatchingFilter<DB, TableName>
  | QueryBuilderFilter<QB>
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
 * with the provided filter.
 */
export function constrainQueryBuilder<
  DB,
  TableName extends keyof DB & string,
  QB extends SelectAllQueryBuilder<DB, TableName, object, TableName>,
  RE extends ReferenceExpression<DB, TableName>
>(
  base: BaseKyselyFacet<DB, TableName>,
  filter: QueryFilter<DB, TableName, QB, RE>
): (qb: QB) => QB;

export function constrainQueryBuilder<
  DB,
  TableName extends keyof DB & string,
  QB extends UpdateQueryBuilder<DB, TableName, TableName, object>,
  RE extends ReferenceExpression<DB, TableName>
>(
  base: BaseKyselyFacet<DB, TableName>,
  filter: QueryFilter<DB, TableName, QB, RE>
): (qb: QB) => QB;

export function constrainQueryBuilder<
  DB,
  TableName extends keyof DB & string,
  QB extends
    | SelectAllQueryBuilder<DB, TableName, object, TableName>
    | UpdateQueryBuilder<DB, TableName, TableName, object>,
  RE extends ReferenceExpression<DB, TableName>
>(
  base: BaseKyselyFacet<DB, TableName>,
  filter: QueryFilter<DB, TableName, QB, RE>
): (qb: QB) => QB {
  // Process a binary operation filter.
  if (Array.isArray(filter)) {
    return (qb) => (qb.where as any)(...filter);
  }

  // Process a field matching filter.
  if (filter?.constructor === Object) {
    if (Object.keys(filter).length == 0) {
      throw new Error("Empty field matching filter");
    }
    return (qb) => {
      for (const [column, value] of Object.entries(filter)) {
        qb = (qb as any).where(base.ref(column as string), "=", value);
      }
      return qb;
    };
  }

  // Process a query builder filter.
  if (typeof filter === "function") {
    return filter;
  }

  // Process a query expression filter.
  return (qb: QB) => (qb.where as any)(filter);
}
