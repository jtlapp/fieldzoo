import { Insertable, Kysely, Selectable, SelectType, Updateable } from "kysely";

import { StandardFacet } from "./StandardFacet";

// TODO: generalize to compound keys and rename to KeyFacet
export class IdFacet<
  DB,
  TableName extends keyof DB & string,
  IdColumnName extends keyof Selectable<DB[TableName]> & string
> extends StandardFacet<
  DB,
  TableName,
  Selectable<DB[TableName]>,
  Insertable<DB[TableName]>,
  Partial<Insertable<DB[TableName]>>,
  [IdColumnName]
> {
  constructor(
    readonly db: Kysely<DB>,
    readonly tableName: TableName,
    readonly idColumnName: IdColumnName
  ) {
    super(db, tableName, { insertReturnColumns: [idColumnName] });
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
