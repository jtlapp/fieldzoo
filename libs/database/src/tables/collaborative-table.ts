import { CreateTableBuilder, Kysely, Selectable, sql } from "kysely";

import { TimestampedColumns, TimestampedTable } from "@fieldzoo/modeling";

export type CollaborativeColumns =
  | TimestampedColumns
  | "modifiedBy"
  | "versionNumber";

/**
 * Utility class for creating tables with `versionNumber`, `modifiedBy`,
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
      tb: CreateTableBuilder<string, "versionNumber" | "modifiedBy">
    ) => CreateTableBuilder<string, any>
  ) {
    await TimestampedTable.create(db, tableName, (tb) =>
      factory(
        tb
          .addColumn("versionNumber", "integer", (col) =>
            col.notNull().defaultTo(1)
          )
          .addColumn("modifiedBy", "integer", (col) =>
            col.references("users.id").onDelete("cascade").notNull()
          )
      )
    );

    // Add a `versionNumber` trigger to the table

    await sql
      .raw(
        `create or replace trigger update_${tableName}_version
          before update on "${tableName}"
          for each row execute procedure update_version_column();`
      )
      .execute(db);
  }

  /**
   * Creates a database function that updates the `versionNumber` column
   * of a table, intended for use as a trigger.
   * @param db Reference to the Kysely DB
   * @returns A promise that adds the function
   */
  static createFunctions(db: Kysely<any>) {
    return sql
      .raw(
        `create or replace function update_version_column()
            returns trigger as $$
          begin
            new."versionNumber" = old."versionNumber" + 1;
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
      .raw(`drop function if exists update_version_column() cascade;`)
      .execute(db);
  }

  static addInsertReturnColumns<T>(toColumns: string[] = []) {
    TimestampedTable.addInsertReturnColumns<T>(toColumns);
    toColumns.push("versionNumber");
    return toColumns as (keyof Selectable<T>)[];
  }

  static addUpdateReturnColumns<T>(toColumns: string[] = []) {
    TimestampedTable.addUpdateReturnColumns<T>(toColumns);
    toColumns.push("versionNumber");
    return toColumns as (keyof Selectable<T>)[];
  }

  static removeGeneratedValues<V extends Record<string, any>>(values: V) {
    delete values["versionNumber"];
    return values as any;
  }
}
