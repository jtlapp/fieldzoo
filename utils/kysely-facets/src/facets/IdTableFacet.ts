import { Insertable, Kysely, Selectable, SelectType } from "kysely";
import { ObjectWithKeys } from "../lib/type-utils";

import { TableFacetOptions, TableFacet } from "./TableFacet";

/**
 * Table facet whose primary key is a single ID columns of some type.
 * @typeparam DB Interface whose fields are table names defining tables.
 * @typeparam TableName Name of the table.
 * @typeparam IdColumnName Name of the ID column.
 * @typeparam SelectedObject Type of objects returned by select queries.
 * @typeparam InsertedObject Type of objects inserted into the table.
 * @typeparam UpdaterObject Type of objects used to update rows of the table.
 * @typeparam ReturnColumns Columns to return from table upon request, whether
 *  returning from an insert or an update. An empty array returns all columns.
 * @typeparam ReturnedObject Type of objects returned from inserts and updates,
 *  when returning objects.
 */
export class IdTableFacet<
  DB,
  TableName extends keyof DB & string,
  IdColumnName extends keyof Selectable<DB[TableName]> & string = "id" &
    keyof Selectable<DB[TableName]>,
  SelectedObject = Selectable<DB[TableName]>,
  InsertedObject = Insertable<DB[TableName]>,
  UpdaterObject = Partial<Insertable<DB[TableName]>>,
  ReturnColumns extends (keyof Selectable<DB[TableName]> & string)[] = [
    IdColumnName
  ],
  ReturnedObject = ReturnColumns extends []
    ? Selectable<DB[TableName]>
    : ObjectWithKeys<Selectable<DB[TableName]>, ReturnColumns>
> extends TableFacet<
  DB,
  TableName,
  SelectedObject,
  InsertedObject,
  UpdaterObject,
  ReturnColumns,
  ReturnedObject
> {
  constructor(
    db: Kysely<DB>,
    tableName: TableName,
    readonly idColumnName: IdColumnName = "id" as any,
    options: TableFacetOptions<
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
  options: TableFacetOptions<
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
