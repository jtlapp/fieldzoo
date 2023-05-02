import { CreateTableBuilder, Kysely, Selectable, sql } from "kysely";

import { TIMESTAMPED_COLUMNS, TimestampedTable } from "@fieldzoo/modeling";

export const COLLABORATIVE_COLUMNS = [
  ...TIMESTAMPED_COLUMNS,
  "version",
] as const;

export type CollaborativeColumns = (typeof COLLABORATIVE_COLUMNS)[number];

/**
 * Utility class for creating tables with `version`, `modifiedBy`,
 * `createdAt`, and `modifiedAt` columns.
 */
export class CollaborativeTable {
  /**
   * @param db Reference to the Kysely DB
   * @param tableName Name of the table to create
   * @returns A Kysely table builder
   */
  static async create(
    db: Kysely<any>,
    tableName: string,
    factory: (
      tb: CreateTableBuilder<string, CollaborativeColumns | "modifiedBy">
    ) => CreateTableBuilder<string, any>
  ) {
    await TimestampedTable.create(db, tableName, (tb) =>
      factory(
        tb
          .addColumn("version", "integer", (col) => col.notNull().defaultTo(1))
          .addColumn("modifiedBy", "integer", (col) =>
            col.references("users.id").onDelete("cascade").notNull()
          )
      )
    );

    // Add a `version` trigger to the table

    await sql
      .raw(
        `create or replace trigger update_${tableName}_version
          before update on "${tableName}"
          for each row execute procedure update_version_column();`
      )
      .execute(db);
  }

  /**
   * Creates a database function that updates the `version` column of a
   * table, intended for use as a trigger.
   * @param db Reference to the Kysely DB
   * @returns A promise that adds the function
   */
  static createTriggers(db: Kysely<any>) {
    return sql
      .raw(
        `create or replace function update_version_column()
            returns trigger as $$
          begin
            new."version" = old."version" + 1;
            return new;
          end;
          $$ language 'plpgsql';`
      )
      .execute(db);
  }

  // TODO: look at replacing this with (targetArray, additionalColumns) params
  static getInsertReturnColumns<T>(extraColumns: string[] = []) {
    return (COLLABORATIVE_COLUMNS as readonly string[]).concat(
      extraColumns
    ) as (keyof Selectable<T>)[];
  }

  // TODO: look at replacing this with (targetArray, additionalColumns) params
  static getUpdateReturnColumns<T>(extraColumns: string[] = []) {
    return TimestampedTable.getUpdateReturnColumns<T>([
      ...extraColumns,
      // TODO: do this elsehow
      "version",
    ]);
  }

  // TODO: look at making this generic across utility tables
  static getUpsertValues(entity: object, extraValues: object = {}) {
    const values = { ...entity, ...extraValues } as any;
    for (const column of COLLABORATIVE_COLUMNS) {
      delete values[column];
    }
    return values;
  }
}
