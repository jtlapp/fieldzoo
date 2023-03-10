/**
 * The type and implementation of the query filter object, which can
 * be passed as an argument to query functions to constrain results.
 */

import { ReferenceExpression, WhereInterface } from "kysely";

import { KyselyFacet } from "../facets/KyselyFacet";
import { AppliedFilter } from "./AppliedFilter";
import { QueryFilter, applyQueryFilter } from "./QueryFilter";

/**
 * A filter that is a combination of other filters.
 */
export abstract class ComboFilter<
  DB,
  TableName extends keyof DB & string,
  QB extends WhereInterface<any, any>,
  RE extends ReferenceExpression<DB, TableName>
> extends AppliedFilter<DB, TableName, QB> {
  filters: QueryFilter<DB, TableName, QB, RE>[];

  /**
   * Constructs a combo filter.
   * @param filters The filters to combine.
   */
  constructor(filters: QueryFilter<any, any, any, any>[]) {
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
  QB extends WhereInterface<any, any>,
  RE extends ReferenceExpression<DB, TableName>
> extends ComboFilter<DB, TableName, QB, RE> {
  apply(base: KyselyFacet<DB, TableName>): (qb: QB) => QB {
    return (qb) => {
      for (const filter of this.filters) {
        qb = applyQueryFilter(base, filter)(qb) as QB;
      }
      return qb;
    };
  }
}

/**
 * A filter that matches at least one of the provided filters.
 * @param filters The filters to combine, listed as separate arguments.
 */
export class MatchAnyFilter<
  DB,
  TableName extends keyof DB & string,
  QB extends WhereInterface<any, any>,
  RE extends ReferenceExpression<DB, TableName>
> extends ComboFilter<DB, TableName, QB, RE> {
  apply(base: KyselyFacet<DB, TableName>): (qb: QB) => QB {
    return (qb) => {
      for (const filter of this.filters) {
        qb = qb.orWhere((qb) => applyQueryFilter(base, filter)(qb as QB)) as QB;
      }
      return qb;
    };
  }
}
