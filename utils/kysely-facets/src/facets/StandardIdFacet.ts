import { Insertable, Kysely, Selectable, SelectType } from "kysely";
import { ObjectWithKeys } from "../lib/type-utils";

import { StandardFacetOptions, StandardFacet } from "./StandardFacet";

// TODO: generalize to compound keys and rename to KeyFacet
export class StandardIdFacet<
  DB,
  TableName extends keyof DB & string,
  IdColumnName extends keyof Selectable<DB[TableName]> & string = "id" &
    keyof Selectable<DB[TableName]>,
  SelectedObject = Selectable<DB[TableName]>,
  InsertedObject = Insertable<DB[TableName]>,
  UpdaterObject = Partial<Insertable<DB[TableName]>>,
  ReturnColumns extends (keyof Selectable<DB[TableName]> & string)[] = [],
  ReturnedObject = ReturnColumns extends []
    ? Selectable<DB[TableName]>
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
    options: StandardFacetOptions<
      DB,
      TableName,
      SelectedObject,
      InsertedObject,
      UpdaterObject,
      ReturnColumns,
      ReturnedObject
    > = {}
  ) {
    super(db, tableName, _prepareOptions(idColumnName, options) as any);
  }

  /**
   * Delete the row having the given ID.
   * @param id The ID of the row to delete.
   * @returns True if a row was deleted, false otherwise.
   */
  async deleteById(
    id: SelectType<DB[TableName][IdColumnName]>
  ): Promise<boolean> {
    const count = await this.delete([this.ref(this.idColumnName), "=", id]);
    return count == 1;
  }

  /**
   * Select the row having the given ID.
   * @param id The ID of the row to select.
   * @returns An object for the row, or null if no row was found.
   */
  selectById(
    id: SelectType<DB[TableName][IdColumnName]>
  ): Promise<SelectedObject | null> {
    return this.selectOne([this.ref(this.idColumnName), "=", id]);
  }

  /**
   * Update the row having the given ID, without returning any columns.
   * @param obj Object containing the fields to update. The ID of the row
   *  to update is taken from this object.
   * @returns True if a row was updated, false otherwise.
   */
  async updateById(obj: UpdaterObject): Promise<boolean> {
    const updateCount = await this.update(
      [this.ref(this.idColumnName), "=", (obj as any)[this.idColumnName]],
      obj as any
    );
    return updateCount == 1;
  }

  /**
   * Update the row having the given ID, returning the columns specified in
   * the `returnColumns` option from the row or rows.
   * @param obj Object containing the fields to update. The ID of the row
   * to update is taken from this object.
   * @returns An object for the row, or null if no row was found.
   */
  async updateByIdReturning(
    obj: UpdaterObject
  ): Promise<ReturnedObject | null> {
    const updates = await this.updateReturning(
      [this.ref(this.idColumnName), "=", (obj as any)[this.idColumnName]],
      obj as any
    );
    return updates.length == 0 ? null : updates[0];
  }
}

/**
 * Ensure that returnColumns includes idColumnName.
 */
function _prepareOptions<
  DB,
  TableName extends keyof DB & string,
  IdColumnName extends keyof Selectable<DB[TableName]> & string,
  SelectedObject,
  InsertedObject,
  UpdaterObject,
  ReturnColumns extends (keyof Selectable<DB[TableName]> & string)[],
  ReturnedObject
>(
  idColumnName: IdColumnName,
  options: StandardFacetOptions<
    DB,
    TableName,
    SelectedObject,
    InsertedObject,
    UpdaterObject,
    ReturnColumns,
    ReturnedObject
  >
) {
  const returnColumns: (keyof Selectable<DB[TableName]> & string)[] =
    options.returnColumns ?? [];
  if (returnColumns.length !== 0 && !returnColumns.includes(idColumnName)) {
    throw Error(
      "'returnColumns' must include 'idColumnName' (e.g. [] includes all columns)"
    );
  }
  return { ...options, returnColumns };
}
