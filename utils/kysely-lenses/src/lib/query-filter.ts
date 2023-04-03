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
  WhereExpressionFactory,
  WhereInterface,
} from "kysely";

import { QueryLens } from "../lenses/QueryLens";

type AnyWhereInterface = WhereInterface<any, any>;

/**
 * Type of the query filter object, which can be passed as an argument
 * to query functions to constrain results.
 */
export type QueryFilter<
  DB,
  TableName extends keyof DB & string,
  RE extends ReferenceExpression<DB, TableName>,
  QB1 extends AnyWhereInterface,
  QB2 extends AnyWhereInterface = QB1
> =
  | BinaryOperationFilter<DB, TableName, RE>
  | FieldMatchingFilter<DB, TableName, RE>
  | QueryModifier<QB1, QB2>
  | WhereExpressionFactory<DB, TableName>
  | Expression<any>;

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
 * a caller-modified query builder.
 */
export class QueryModifier<
  QB1 extends AnyWhereInterface,
  QB2 extends AnyWhereInterface
> {
  constructor(readonly modifier: (qb: QB1) => QB2) {}
}

/**
 * Returns a query builder that constrains the provided query builder
 * according to the provided query filter.
 * @param base The Kysely lens that is used to create references.
 * @param qb The query builder to constrain.
 * @param filter The query filter.
 * @returns A query builder constrained for the provided query filter.
 */
export function applyQueryFilter<
  DB,
  TableName extends keyof DB & string,
  QB1 extends AnyWhereInterface,
  QB2 extends AnyWhereInterface,
  RE extends ReferenceExpression<DB, TableName>
>(
  base: QueryLens<DB, TableName, any, any>,
  qb: QB1,
  filter: QueryFilter<DB, TableName, RE, QB1, QB2>
): QB2 {
  // Process a where expression factory.
  if (typeof filter === "function") {
    return qb.where(filter) as QB2;
  }

  // Process a query expression filter. Check for expressions
  // first because they could potentially be plain objects.
  if ("expressionType" in filter) {
    return qb.where(filter) as QB2;
  }

  // Process a query modifier filter.
  if (filter instanceof QueryModifier) {
    return filter.modifier(qb);
  }

  // Process a field matching filter. `{}` matches all rows.
  if (filter.constructor === Object) {
    for (const [column, value] of Object.entries(filter)) {
      qb = qb.where(base.ref(column), "=", value) as QB1;
    }
    return qb as unknown as QB2;
  }

  // Process a binary operation filter.
  if (Array.isArray(filter)) {
    return qb.where(...filter) as QB2;
  }

  throw Error("Unrecognized query filter");
}
