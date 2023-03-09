import { Insertable, Kysely, Selectable, SelectType, Updateable } from "kysely";
import { ObjectWithKeys } from "../lib/type-utils";
import { FacetOptions } from "./FacetOptions";

import { StandardFacet } from "./StandardFacet";

// TODO: generalize to compound keys and rename to KeyFacet
export class StandardIdFacet<
  DB,
  TableName extends keyof DB & string,
  IdColumnName extends keyof Selectable<DB[TableName]> & string = "id" &
    keyof Selectable<DB[TableName]>,
  SelectedObject = Selectable<DB[TableName]>,
  InsertedObject = Insertable<DB[TableName]>,
  UpdaterObject = Partial<Insertable<DB[TableName]>>,
  ReturnColumns extends (keyof Selectable<DB[TableName]> & string)[] | ["*"] = [
    IdColumnName
  ],
  ReturnedObject = ReturnColumns extends []
    ? void
    : ObjectWithKeys<Selectable<DB[TableName]>, ReturnColumns>
> extends StandardFacet<
  DB,
  TableName,
  SelectedObject,
  InsertedObject,
  UpdaterObject,
  ReturnColumns,
  ReturnedObject
> {
  constructor(
    readonly db: Kysely<DB>,
    readonly tableName: TableName,
    readonly idColumnName: IdColumnName = "id" as any,
    options?: FacetOptions<
      DB,
      TableName,
      SelectedObject,
      InsertedObject,
      UpdaterObject,
      ReturnColumns,
      ReturnedObject
    >
  ) {
    super(db, tableName, _prepareOptions(idColumnName, options) as any);
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

  selectById(id: SelectType<DB[TableName][IdColumnName]>) {
    return this.selectOne([this.ref(this.idColumnName), "=", id]);
  }

  async updateById(obj: Updateable<DB[TableName]>) {
    const updateCount = await this.update(
      [this.ref(this.idColumnName), "=", (obj as any)[this.idColumnName]],
      obj as any
    );
    return updateCount == 1;
  }
}

function _prepareOptions<
  DB,
  TableName extends keyof DB & string,
  IdColumnName extends keyof Selectable<DB[TableName]> & string,
  SelectedObject,
  InsertedObject,
  UpdaterObject,
  ReturnColumns extends (keyof Selectable<DB[TableName]> & string)[] | ["*"],
  ReturnedObject
>(
  idColumnName: IdColumnName,
  options?: FacetOptions<
    DB,
    TableName,
    SelectedObject,
    InsertedObject,
    UpdaterObject,
    ReturnColumns,
    ReturnedObject
  >
) {
  const returnColumns = options?.returnColumns ?? [idColumnName];
  if (
    !returnColumns.includes(idColumnName as any) &&
    !returnColumns.includes("*" as any)
  ) {
    throw Error("returnColumns must include idColumnName");
  }
  return { ...options, returnColumns };
}
