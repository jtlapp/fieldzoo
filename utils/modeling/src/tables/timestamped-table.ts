import { CreateTableBuilder, Kysely, Selectable, sql } from "kysely";
import { TimestampedEntity } from "../entities/timestamped-entity";

const timestampedColumns = ["createdAt", "modifiedAt"] as const;

export type TimestampedColumns = (typeof timestampedColumns)[number];

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
    ) => CreateTableBuilder<string, any>,
    withTriggers = true
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

    if (withTriggers) {
      await sql
        .raw(
          `create or replace trigger update_${tableName}_modifiedAt
        before update on "${tableName}"
        for each row execute procedure update_modifiedAt_column();`
        )
        .execute(db);
    }
  }

  /**
   * Creates a database function that updates the `modifiedAt` column of a
   * table, intended for use as a trigger.
   * @param db Reference to the Kysely DB
   * @returns A promise that adds the function
   */
  static createTriggers(db: Kysely<any>) {
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

  static getInsertReturnColumns<T>(extraColumns: string[] = []) {
    return (timestampedColumns as readonly string[]).concat(
      extraColumns
    ) as (keyof Selectable<T>)[];
  }

  static getUpdateReturnColumns<T>(extraColumns: string[] = []) {
    return ["modifiedAt"].concat(extraColumns) as (keyof Selectable<T>)[];
  }

  static getUpdateReturnValues(
    entity: TimestampedEntity,
    returns: object,
    extraValues: object = {}
  ) {
    return {
      ...entity,
      ...returns,
      ...extraValues,
      createdAt: entity.createdAt,
    };
  }

  static getUpsertValues(entity: object, extraValues: object = {}) {
    const values = { ...entity, ...extraValues } as any;
    for (const column of timestampedColumns) {
      delete values[column];
    }
    return values;
  }
}
