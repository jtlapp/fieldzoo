import { Kysely } from "kysely";

/**
 * Base class for all Kysely facets.
 */
export class KyselyFacet<DB, TableName extends keyof DB & string> {
  constructor(readonly db: Kysely<DB>, readonly tableName: TableName) {}

  /**
   * Creates a query builder for inserting rows into this table.
   * @returns A query builder for inserting rows into this table.
   */
  insertRows() {
    return this.db.insertInto(this.tableName);
  }

  /**
   * Creates a query builder for updating rows in this table.
   * @returns A query builder for updating rows in this table.
   */
  updateRows() {
    return this.db.updateTable(this.tableName);
  }

  /**
   * Creates a query builder for selecting rows from this table.
   * @returns A query builder for selecting rows from this table.
   */
  selectRows() {
    return this.db.selectFrom(this.tableName).selectAll();
  }

  /**
   * Creates a query builder for deleting rows from this table.
   * @returns A query builder for deleting rows from this table.
   */
  deleteRows() {
    return this.db.deleteFrom(this.tableName);
  }

  /**
   * Returns a reference to a column, which can be a generated string.
   * @param column The column name being referenced.
   * @returns A reference to the given column.
   */
  ref(column: string) {
    return this.db.dynamic.ref(column);
  }
}
