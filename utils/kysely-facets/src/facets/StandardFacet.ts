import {
  Kysely,
  Insertable,
  ReferenceExpression,
  Selectable,
  UpdateObject,
  UpdateQueryBuilder,
  UpdateResult,
} from "kysely";
import { SelectAllQueryBuilder } from "kysely/dist/cjs/parser/select-parser";

import { KyselyFacet } from "./KyselyFacet";
import { QueryFilter, applyQueryFilter } from "../filters/QueryFilter";
import { FacetOptions } from "./FacetOptions";

export class StandardFacet<
  DB,
  TableName extends keyof DB & string,
  SelectedType = Selectable<DB[TableName]>,
  InsertedType = Insertable<DB[TableName]>,
  UpdatedType = Partial<InsertedType>,
  ReturnedType = Partial<SelectedType>
> extends KyselyFacet<
  DB,
  TableName,
  SelectedType,
  InsertedType,
  UpdatedType,
  ReturnedType
> {
  /**
   * Constructs a new Kysely table.
   * @param db The Kysely database.
   * @param tableName The name of the table.
   */
  constructor(
    db: Kysely<DB>,
    tableName: TableName,
    options?: FacetOptions<
      DB,
      TableName,
      SelectedType,
      InsertedType,
      UpdatedType,
      ReturnedType
    >
  ) {
    super(db, tableName, options);
  }

  /**
   * Inserts multiple rows into this table, optionally returning columns
   * from the inserted rows.
   * @param objs The objects to insert as rows.
   * @param returning The columns to return from the inserted rows. If
   *   `["*"]` is given, all columns are returned. If a list of field names
   *    is given, returns only those field names. If omitted, no columns
   *    are returned. Useful for getting auto-generated columns.
   * @returns An array of objects containing the requested return columns,
   *   if any. Returns `void` when `returning` is omitted.
   */
  insertMany(objs: InsertedType[]): Promise<void>;

  insertMany<O extends Selectable<DB[TableName]>, R extends keyof O>(
    objs: InsertedType[],
    returning: R[]
  ): Promise<Pick<O, R>[]>;

  insertMany<O extends Selectable<DB[TableName]>>(
    objs: InsertedType[],
    returning: ["*"]
  ): Promise<Selectable<DB[TableName]>[]>;

  async insertMany<
    O extends Selectable<DB[TableName]>,
    R extends keyof O & keyof DB[TableName] & string
  >(
    objs: InsertedType[],
    returning?: R[] | ["*"]
  ): Promise<Selectable<DB[TableName]>[] | Pick<O, R>[] | void> {
    const qb = this.insertRows().values(this.transformInsertion(objs));
    if (returning) {
      // Cast here because TS wasn't allowing the check.
      if ((returning as string[]).includes("*")) {
        const result = await qb.returningAll().execute();
        return result as Selectable<DB[TableName]>[];
      }
      if (returning.length > 0) {
        const result = await qb.returning(returning as any).execute();
        return result as Pick<O, R>[];
      }
      await qb.execute();
      return objs.map((_) => ({})) as Pick<O, R>[];
    }
    await qb.execute();
  }

  /**
   * Inserts a single row into this table, optionally returning columns
   * from the inserted row.
   * @param obj The object to insert as a row.
   * @param returning The columns to return from the inserted row. If
   *    `["*"]` is given, all columns are returned. If a list of field names
   *    is given, returns only those field names. If omitted, no columns
   *    are returned. Useful for getting auto-generated columns.
   * @returns An object containing the requested return columns, if any.
   *    Returns `void` when `returning` is omitted.
   */
  insertOne(obj: InsertedType): Promise<void>;

  insertOne<O extends Selectable<DB[TableName]>, R extends keyof O>(
    obj: InsertedType,
    returning: R[]
  ): Promise<Pick<O, R>>;

  insertOne<O extends Selectable<DB[TableName]>>(
    obj: InsertedType,
    returning: ["*"]
  ): Promise<Selectable<DB[TableName]>>;

  async insertOne<
    O extends Selectable<DB[TableName]>,
    R extends keyof O & keyof DB[TableName] & string
  >(
    obj: InsertedType,
    returning?: R[] | ["*"]
  ): Promise<Selectable<DB[TableName]> | Pick<O, R> | void> {
    const transformedObj = this.transformInsertion(obj);
    const qb = this.insertRows().values(transformedObj);
    if (returning) {
      // Cast here because TS wasn't allowing the check.
      if ((returning as string[]).includes("*")) {
        const result = await qb.returningAll().executeTakeFirstOrThrow();
        return result as Selectable<DB[TableName]>;
      }
      if (returning.length > 0) {
        const result = await qb
          .returning(returning as any)
          .executeTakeFirstOrThrow();
        return result as Pick<O, R>;
      }
      await qb.execute();
      return {} as Pick<O, R>;
    }
    await qb.execute();
  }

  // TODO: consider combining selectMany() and selectOne() into select().
  /**
   * Selects zero or more rows from this table, selecting rows according
   * to the provided filter.
   * @param filter Filter that constrains the selected rows.
   * @returns An array of objects containing the selected rows, possibly empty.
   */
  async selectMany<
    QB extends SelectAllQueryBuilder<DB, TableName, object, TableName>,
    RE extends ReferenceExpression<DB, TableName>
  >(filter: QueryFilter<DB, TableName, QB, RE>): Promise<SelectedType[]> {
    const sqb = this.selectRows().selectAll();
    const fqb = applyQueryFilter(this, filter)(sqb as any);
    const selections = await fqb.execute();
    return this.transformSelection(selections as Selectable<DB[TableName]>[]);
  }

  /**
   * Selects at most one row from this table, selecting rows according
   * to the provided filter.
   * @param filter Filter that constrains the selection.
   * @returns An object containing the selected row, or `null` if no row
   *    was selected.
   */
  async selectOne<
    QB extends SelectAllQueryBuilder<DB, TableName, object, TableName>,
    RE extends ReferenceExpression<DB, TableName>
  >(filter: QueryFilter<DB, TableName, QB, RE>): Promise<SelectedType | null> {
    const sqb = this.selectRows().selectAll();
    const fqb = applyQueryFilter(this, filter)(sqb as any);
    const selection = await fqb.executeTakeFirst();
    if (!selection) return null;
    return this.transformSelection(selection as Selectable<DB[TableName]>);
  }

  /**
   * Updates rows in this table matching the provided filter,
   * optionally returning columns from the updated rows.
   * @param filter Filter specifying the rows to update.
   * @param obj The object whose field values are to be assigned to the row.
   * @param returning The columns to return from the updated row. If
   *    `["*"]` is given, all columns are returned. If a list of field names
   *    is given, returns only those field names. If omitted, no columns
   *    are returned. Useful for getting auto-generated columns.
   * @returns If `returning` was provided, returns an array of objects
   *    having the requested returned column values. Otherwise, returns
   *    the number of rows updated.
   */
  update<
    QB extends UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>,
    RE extends ReferenceExpression<DB, TableName>
  >(
    filter: QueryFilter<DB, TableName, QB, RE>,
    obj: UpdateObject<DB, TableName>
  ): Promise<number>;

  update<
    QB extends UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>,
    RE extends ReferenceExpression<DB, TableName>,
    R extends keyof Selectable<DB[TableName]> & string
  >(
    filter: QueryFilter<DB, TableName, QB, RE>,
    obj: UpdateObject<DB, TableName>,
    returning: R[]
  ): Promise<Pick<Selectable<DB[TableName]>, R>[]>;

  update<
    QB extends UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>,
    RE extends ReferenceExpression<DB, TableName>
  >(
    filter: QueryFilter<DB, TableName, QB, RE>,
    obj: UpdateObject<DB, TableName>,
    returning: ["*"]
  ): Promise<Selectable<DB[TableName]>[]>;

  async update<
    QB extends UpdateQueryBuilder<DB, TableName, TableName, UpdateResult>,
    RE extends ReferenceExpression<DB, TableName>,
    R extends keyof Selectable<DB[TableName]> & string
  >(
    filter: QueryFilter<DB, TableName, QB, RE>,
    obj: UpdateObject<DB, TableName>,
    returning?: R[] | ["*"]
  ): Promise<
    Selectable<DB[TableName]>[] | Pick<Selectable<DB[TableName]>, R>[] | number
  > {
    const uqb = this.updateRows().set(obj as any);
    const fqb = applyQueryFilter(this, filter)(uqb as any);
    if (returning) {
      // Cast here because TS wasn't allowing the check.
      if ((returning as string[]).includes("*")) {
        const result = await fqb.returningAll().execute();
        return result as Selectable<DB[TableName]>[];
      }
      if (returning.length > 0) {
        const result = await fqb.returning(returning as any).execute();
        return result as Pick<Selectable<DB[TableName]>, R>[];
      }
      await fqb.execute();
      return [];
    }
    const result = await fqb.executeTakeFirstOrThrow();
    return Number(result.numUpdatedRows);
  }
}
