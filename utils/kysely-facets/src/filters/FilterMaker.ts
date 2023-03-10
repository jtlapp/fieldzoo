import { ReferenceExpression, WhereInterface } from "kysely";

import { MatchAllFilter, MatchAnyFilter } from "./ComboFilter";
import { QueryFilter } from "./QueryFilter";

export class FilterMaker<
  DB,
  TableName extends keyof DB & string,
  QB extends WhereInterface<any, any>
> {
  /**
   * Returns a filter that matches all of the provided filters.
   */
  allOf<RE extends ReferenceExpression<DB, TableName>>(
    ...filters: QueryFilter<DB, TableName, QB, RE>[]
  ): MatchAllFilter<DB, TableName, QB, RE> {
    return new MatchAllFilter(filters);
  }

  /**
   * Returns a filter that matches at least one of the provided filters.
   * @param filters The filters to combine, listed as separate arguments.
   */
  anyOf<RE extends ReferenceExpression<DB, TableName>>(
    ...filters: QueryFilter<DB, TableName, QB, RE>[]
  ): MatchAnyFilter<DB, TableName, QB, RE> {
    return new MatchAnyFilter(filters);
  }
}
