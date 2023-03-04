import { Kysely } from "kysely";

/**
 * Base class for all Kysely facets.
 */
export class BaseKyselyFacet<DB, TableName extends keyof DB & string> {
  constructor(readonly db: Kysely<DB>, readonly tableName: TableName) {}

  /**
   * Returns a reference to a column, which can be a generated string.
   * @param column The column name being referenced.
   * @returns A reference to the given column.
   */
  ref(column: string) {
    return this.db.dynamic.ref(column);
  }
}
