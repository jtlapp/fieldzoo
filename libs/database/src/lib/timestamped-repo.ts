import { Selectable, Selection } from "kysely";

import { TimestampedEntity } from "@fieldzoo/model";

export class TimestampedRepo<DB, TB extends keyof DB> {
  getInsertReturnColumns(extraColumns: string[] = []) {
    return ["createdAt", "modifiedAt"].concat(
      extraColumns
    ) as (keyof Selectable<DB[TB]>)[];
  }

  getUpdateReturnColumns() {
    return ["modifiedAt"] as (keyof Selectable<DB[TB]>)[];
  }

  getUpsertValues<Entity extends TimestampedEntity>(entity: Entity): any {
    const values = { ...entity } as any;
    delete values["createdAt"];
    delete values["modifiedAt"];
    return values;
  }

  getInsertReturnValues<Entity extends TimestampedEntity>(
    entity: Entity,
    returns: Partial<Selection<DB, TB, any>>,
    getters: object
  ) {
    return {
      ...entity,
      ...getters,
      createdAt: returns.createdAt,
      modifiedAt: returns.modifiedAt,
    };
  }

  getUpdateReturnValues<Entity extends TimestampedEntity>(
    entity: Entity,
    returns: Partial<Selection<DB, TB, any>>
  ) {
    return {
      ...entity,
      createdAt: entity.createdAt,
      modifiedAt: returns.modifiedAt,
    };
  }
}
