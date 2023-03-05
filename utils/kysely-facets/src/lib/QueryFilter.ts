/**
 * The type and implementation of the query filter object, which can
 * be passed as an argument to query functions to constrain results.
 */

import {
  ComparisonOperatorExpression,
  Expression,
  OperandValueExpressionOrList,
  ReferenceExpression,
  SelectQueryBuilder,
  Updateable,
  UpdateQueryBuilder,
  WhereInterface,
} from "kysely";

import { KyselyFacet } from "../facets/KyselyFacet";

type AnyQueryBuilder<DB, TableName extends keyof DB & string> =
  | SelectQueryBuilder<DB, TableName, object>
  | UpdateQueryBuilder<DB, TableName, TableName, object>
  | WhereInterface<DB, TableName>;
type WhereQB<QB> = QB extends AnyQueryBuilder<infer DB, infer TableName>
  ? Pick<SelectQueryBuilder<DB, TableName, object>, "where">
  : never;

/**
 * Type of the query filter object, which can be passed as an argument
 * to query functions to constrain results.
 */
export type QueryFilter<
  DB,
  TableName extends keyof DB & string,
  QB extends AnyQueryBuilder<DB, TableName>,
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
 * A filter that is a combination of other filters.
 */
export abstract class ComboFilter {
  constructor(readonly filters: QueryFilter<any, any, any, any>[]) {}

  abstract apply<
    DB,
    TableName extends keyof DB & string,
    QB extends AnyQueryBuilder<DB, TableName>
  >(
    base: KyselyFacet<DB, TableName>,
    qb: QB
  ): (qb: QB) => WhereInterface<DB, TableName>;
}

/**
 * A filter that matches all of the provided filters.
 */
export class MatchAll extends ComboFilter {
  apply<
    DB,
    TableName extends keyof DB & string,
    QB extends AnyQueryBuilder<DB, TableName>
  >(
    base: KyselyFacet<DB, TableName>
  ): (qb: QB) => WhereInterface<DB, TableName> {
    return (qb) => {
      for (const filter of this.filters) {
        qb = applyQueryFilter(base, filter)(qb);
      }
      return qb;
    };
  }
}

/**
 * A filter that matches any of the provided filters.
 */
export class MatchAny extends ComboFilter {
  apply<
    DB,
    TableName extends keyof DB & string,
    QB extends AnyQueryBuilder<DB, TableName>
  >(
    base: KyselyFacet<DB, TableName>
  ): (qb: QB) => WhereInterface<DB, TableName> {
    return (qb) => {
      let wqb: WhereInterface<DB, TableName> = qb;
      for (const filter of this.filters) {
        wqb = wqb.orWhere((qb) => applyQueryFilter(base, filter)(qb));
      }
      return wqb;
    };
  }
}

/**
 * Returns a query builder that constrains the provided query builder
 * with the provided filter.
 */
export function applyQueryFilter<
  DB,
  TableName extends keyof DB & string,
  QB extends SelectQueryBuilder<DB, TableName, object>,
  RE extends ReferenceExpression<DB, TableName>
>(
  base: KyselyFacet<DB, TableName>,
  filter: QueryFilter<DB, TableName, QB, RE>
): (qb: QB) => QB;

export function applyQueryFilter<
  DB,
  TableName extends keyof DB & string,
  QB extends UpdateQueryBuilder<DB, TableName, TableName, object>,
  RE extends ReferenceExpression<DB, TableName>
>(
  base: KyselyFacet<DB, TableName>,
  filter: QueryFilter<DB, TableName, QB, RE>
): (qb: QB) => QB;

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
  QB extends AnyQueryBuilder<DB, TableName>,
  RE extends ReferenceExpression<DB, TableName>
>(
  base: KyselyFacet<DB, TableName>,
  filter: QueryFilter<DB, TableName, QB, RE>
): (qb: QB) => QB {
  // Process a binary operation filter.
  if (Array.isArray(filter)) {
    return (qb) => (qb as WhereQB<QB>).where(...filter) as QB;
  }

  // Process a query builder filter.
  if (typeof filter === "function") {
    return filter;
  }

  if (typeof filter === "object" && filter !== null) {
    // Process a query expression filter.
    if ("expressionType" in filter) {
      return (qb) => (qb as WhereQB<QB>).where(filter) as QB;
    }

    // Process a field matching filter. `{}` matches all rows.
    return (qb) => {
      for (const [column, value] of Object.entries(filter)) {
        // prettier-ignore
        qb = (qb as WhereQB<QB>)
                .where(base.ref(column as string), "=", value) as QB;
      }
      return qb;
    };
  }

  throw new Error("Unrecognized query filter");
}
