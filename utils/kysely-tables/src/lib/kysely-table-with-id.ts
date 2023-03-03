import { Kysely, SelectType, Updateable } from "kysely";

import { KyselyTable } from "./kysely-table";

// TODO: generalize to compound keys and rename to KyselyTableWithKey
export class KyselyTableWithID<
  DB,
  TableName extends keyof DB & string,
  IdColumnName extends keyof DB[TableName] & string
> extends KyselyTable<DB, TableName> {
  constructor(
    readonly db: Kysely<DB>,
    readonly tableName: TableName,
    readonly idColumnName: IdColumnName
  ) {
    super(db, tableName);
  }

  async deleteById(
    id: SelectType<DB[TableName][IdColumnName]>
  ): Promise<boolean> {
    const result = await this.db
      .deleteFrom(this.tableName)
      .where(this.ref(this.idColumnName), "=", id)
      .executeTakeFirst();
    return Number(result.numDeletedRows) == 1;
  }

  async selectById(id: SelectType<DB[TableName][IdColumnName]>) {
    const obj = await this.db
      .selectFrom(this.tableName)
      .selectAll()
      .where(this.ref(this.idColumnName), "=", id)
      .executeTakeFirst();
    return obj || null;
  }

  async updateById(obj: Updateable<DB[TableName]>) {
    const result = await this.db
      .updateTable(this.tableName)
      .set(obj as any)
      .where(this.ref(this.idColumnName), "=", (obj as any)[this.idColumnName])
      .executeTakeFirst();
    return Number(result.numUpdatedRows) == 1;
  }
}
