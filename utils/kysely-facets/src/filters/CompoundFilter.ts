/**
 * Compound filters, consisting of multiple filters.
 */

import { ReferenceExpression, WhereInterface } from "kysely";

import { KyselyFacet } from "../facets/KyselyFacet";
import { AppliedFilter } from "./AppliedFilter";
import { QueryFilter, applyQueryFilter } from "./QueryFilter";

/**
 * A filter that is a combination of other filters.
 */
export abstract class CompoundFilter<
  DB,
  TableName extends keyof DB & string,
  QueryOutput,
  QB extends WhereInterface<any, any>,
  RE extends ReferenceExpression<DB, TableName>
> extends AppliedFilter<DB, TableName, QueryOutput, QB> {
  filters: QueryFilter<DB, TableName, QueryOutput, QB, RE>[];

  /**
   * Constructs a compound filter.
   * @param filters The filters to combine.
   */
  constructor(filters: QueryFilter<any, any, any, any, any>[]) {
    super();
    if (filters.length == 0) {
      throw Error("No filters provided");
    }
    this.filters = filters;
  }
}

/**
 * A filter that matches all of the provided filters.
 */
export class MatchAllFilter<
  DB,
  TableName extends keyof DB & string,
  QueryOutput,
  QB extends WhereInterface<any, any>,
  RE extends ReferenceExpression<DB, TableName>
> extends CompoundFilter<DB, TableName, QueryOutput, QB, RE> {
  apply(base: KyselyFacet<DB, TableName, QueryOutput>): (qb: QB) => QB {
    return (qb) => {
      for (const filter of this.filters) {
        qb = applyQueryFilter(base, filter)(qb) as QB;
      }
      return qb;
    };
  }
}

/**
 * Creates a filter that matches all of the provided filters.
 * @param filters The filters to combine, listed as separate arguments.
 * @returns A filter that matches all of the provided filters.
 */
export function allOf<
  DB,
  TableName extends keyof DB & string,
  QueryOutput,
  QB extends WhereInterface<any, any>,
  RE extends ReferenceExpression<DB, TableName>
>(...filters: QueryFilter<DB, TableName, QueryOutput, QB, RE>[]) {
  return new MatchAllFilter<DB, TableName, QueryOutput, QB, RE>(filters);
}

/**
 * A filter that matches at least one of the provided filters.
 * @param filters The filters to combine, listed as separate arguments.
 */
export class MatchAnyFilter<
  DB,
  TableName extends keyof DB & string,
  QueryOutput,
  QB extends WhereInterface<any, any>,
  RE extends ReferenceExpression<DB, TableName>
> extends CompoundFilter<DB, TableName, QueryOutput, QB, RE> {
  apply(base: KyselyFacet<DB, TableName, QueryOutput>): (qb: QB) => QB {
    return (qb) => {
      for (const filter of this.filters) {
        qb = qb.orWhere((qb) => applyQueryFilter(base, filter)(qb as QB)) as QB;
      }
      return qb;
    };
  }
}

/**
 * Creates a filter that matches at least one of the provided filters.
 * @param filters The filters to combine, listed as separate arguments.
 * @returns A filter that matches at least one of the provided filters.
 */
export function anyOf<
  DB,
  TableName extends keyof DB & string,
  QueryOutput,
  QB extends WhereInterface<any, any>,
  RE extends ReferenceExpression<DB, TableName>
>(...filters: QueryFilter<DB, TableName, QueryOutput, QB, RE>[]) {
  return new MatchAnyFilter<DB, TableName, QueryOutput, QB, RE>(filters);
}
