import { WhereInterface } from "kysely";

import { QueryLens } from "../lenses/QueryLens";

/**
 * Base class for custom filters that are implemented as objects.
 */
export abstract class AppliedFilter<
  DB,
  TableName extends keyof DB & string,
  QB extends WhereInterface<any, any>
> {
  /**
   * Applies this filter to a query builder.
   * @param base The lens that this filter is applied to.
   * @param qb The query builder to apply the filter to.
   * @returns A function that takes a query builder and returns a query
   *    builder that is constrained according to this filter.
   */
  abstract apply(base: QueryLens<DB, TableName, any>): (qb: QB) => QB;
}
