import { WhereInterface } from "kysely";

import { KyselyFacet } from "../facets/KyselyFacet";

/**
 * Base class for custom filters that are implemented as objects.
 */
export abstract class AppliedFilter {
  /**
   * Applies this filter to a query builder.
   * @param base The facet that this filter is applied to.
   * @param qb The query builder to apply the filter to.
   * @returns A function that takes a query builder and returns a query
   *    builder that is constrained according to this filter.
   */
  abstract apply<
    DB,
    TableName extends keyof DB & string,
    QB extends WhereInterface<DB, TableName>
  >(base: KyselyFacet<DB, TableName>): (qb: QB) => QB;
}
