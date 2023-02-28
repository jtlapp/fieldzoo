import { Kysely, Updateable } from "kysely";

import { KyselyTable } from "./kysely-table";

export class KyselyTableWithID<
  DB,
  TB extends keyof DB & string,
  ID extends keyof DB[TB] & string
> extends KyselyTable<DB, TB> {
  constructor(
    readonly db: Kysely<DB>,
    readonly tableName: TB,
    readonly idFieldName: ID
  ) {
    super(db, tableName);
  }

  async deleteById(id: number): Promise<boolean> {
    const { ref } = this.db.dynamic;
    const result = await this.db
      .deleteFrom(this.tableName)
      .where(ref(this.idFieldName), "=", id)
      .executeTakeFirst();
    return Number(result.numDeletedRows) == 1;
  }

  async selectById(id: number) {
    const { ref } = this.db.dynamic;
    const obj = await this.db
      .selectFrom(this.tableName)
      .selectAll()
      .where(ref(this.idFieldName), "=", id)
      .executeTakeFirst();
    return obj || null;
  }

  async updateById(obj: Updateable<DB[TB]>) {
    const { ref } = this.db.dynamic;
    await this.db
      .updateTable(this.tableName)
      .set(obj as any)
      .where(ref(this.idFieldName), "=", (obj as any)[this.idFieldName])
      .executeTakeFirst();
  }
}
