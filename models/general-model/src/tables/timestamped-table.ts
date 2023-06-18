import { CreateTableBuilder, Kysely, Selectable, sql } from "kysely";

const TIMESTAMPED_COLUMNS = ["createdAt", "modifiedAt"] as const;

export type TimestampedColumns = (typeof TIMESTAMPED_COLUMNS)[number];

/**
 * Utility class for creating tables with `createdAt` and `modifiedAt`
 * timestamp columns.
 */
export class TimestampedTable {
  /**
   * Creates a table having `createdAt` and `modifiedAt` timestamps.
   * @param db Reference to the Kysely DB
   * @param tableName Name of the table to create
   * @returns A Kysely table builder
   */
  static async create(
    db: Kysely<any>,
    tableName: string,
    factory: (
      tb: CreateTableBuilder<string, TimestampedColumns>
    ) => CreateTableBuilder<string, any>
  ) {
    await factory(
      db.schema
        .createTable(tableName)
        .addColumn("createdAt", "timestamp", (col) =>
          col.defaultTo(sql`now()`).notNull()
        )
        .addColumn("modifiedAt", "timestamp", (col) =>
          col.defaultTo(sql`now()`).notNull()
        )
    ).execute();

    // Add a `modifiedAt` trigger to the table

    // TODO: apparently bad for DB performance; look into using `NOW()`
    await sql
      .raw(
        `create or replace trigger update_${tableName}_modifiedAt
        before update on "${tableName}"
        for each row execute procedure update_modifiedAt_column();`
      )
      .execute(db);
  }

  /**
   * Creates a database function that updates the `modifiedAt` column of a
   * table, intended for use as a trigger.
   * @param db Reference to the Kysely DB
   * @returns A promise that adds the function
   */
  static createFunctions(db: Kysely<any>) {
    return sql
      .raw(
        `create or replace function update_modifiedAt_column()
          returns trigger as $$
        begin
          new."modifiedAt" = now();
          return new;
        end;
        $$ language 'plpgsql';`
      )
      .execute(db);
  }

  /**
   * Deletes created functions.
   * @param db Reference to the Kysely DB
   * @returns A promise that deletes the triggers and functions
   */
  static async dropFunctions(db: Kysely<any>) {
    await sql
      .raw(`drop function if exists update_modifiedAt_column() cascade;`)
      .execute(db);
  }

  static addInsertReturnColumns<T>(toColumns: string[] = []) {
    toColumns.push(...TIMESTAMPED_COLUMNS);
    return toColumns as (keyof Selectable<T>)[];
  }

  static addUpdateReturnColumns<T>(toColumns: string[] = []) {
    toColumns.push("modifiedAt");
    return toColumns as (keyof Selectable<T>)[];
  }

  static removeGeneratedValues<V extends Record<string, any>>(values: V) {
    for (const column of TIMESTAMPED_COLUMNS) {
      delete values[column];
    }
    return values as any;
  }
}
