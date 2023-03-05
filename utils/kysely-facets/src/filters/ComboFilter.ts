/**
 * The type and implementation of the query filter object, which can
 * be passed as an argument to query functions to constrain results.
 */

import { WhereInterface } from "kysely";

import { KyselyFacet } from "../facets/KyselyFacet";
import { AppliedFilter } from "./AppliedFilter";
import { QueryFilter, applyQueryFilter } from "./QueryFilter";

/**
 * A filter that is a combination of other filters.
 */
export abstract class ComboFilter extends AppliedFilter {
  filters: QueryFilter<any, any, any, any>[];

  /**
   * Constructs a combo filter.
   * @param filters The filters to combine.
   */
  constructor(filters: QueryFilter<any, any, any, any>[]) {
    super();
    if (filters.length == 0) {
      throw new Error("No filters provided");
    }
    this.filters = filters;
  }
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
 * Returns a filter that matches all of the provided filters.
 */
export function matchAll(
  ...filters: QueryFilter<any, any, any, any>[]
): MatchAll {
  return new MatchAll(filters);
}

/**
 * A filter that matches at least one of the provided filters.
 * @param filters The filters to combine, listed as separate arguments.
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
 * Returns a filter that matches at least one of the provided filters.
 * @param filters The filters to combine, listed as separate arguments.
 */
export function matchAny(
  ...filters: QueryFilter<any, any, any, any>[]
): MatchAny {
  return new MatchAny(filters);
}
