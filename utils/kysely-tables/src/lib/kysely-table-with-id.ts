import { Kysely, SelectType, Updateable } from "kysely";

import { KyselyTable } from "./kysely-table";

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
    const { ref } = this.db.dynamic;
    const result = await this.db
      .deleteFrom(this.tableName)
      .where(ref(this.idColumnName), "=", id)
      .executeTakeFirst();
    return Number(result.numDeletedRows) == 1;
  }

  async selectById(id: SelectType<DB[TableName][IdColumnName]>) {
    const { ref } = this.db.dynamic;
    const obj = await this.db
      .selectFrom(this.tableName)
      .selectAll()
      .where(ref(this.idColumnName), "=", id)
      .executeTakeFirst();
    return obj || null;
  }

  async updateById(obj: Updateable<DB[TableName]>) {
    const { ref } = this.db.dynamic;
    await this.db
      .updateTable(this.tableName)
      .set(obj as any)
      .where(ref(this.idColumnName), "=", (obj as any)[this.idColumnName])
      .executeTakeFirst();
  }
}
