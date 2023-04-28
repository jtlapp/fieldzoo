import { Selectable, Selection } from "kysely";

import { TimestampedEntity } from "@fieldzoo/model";

/**
 * Repository for persisting entities with `createdAt` and `modifiedAt`
 * timestamp columns.
 */
export abstract class TimestampedRepo<DB, TB extends keyof DB> {
  getInsertReturnColumns(extraColumns: string[] = []) {
    return ["createdAt", "modifiedAt"].concat(
      extraColumns
    ) as (keyof Selectable<DB[TB]>)[];
  }

  getUpdateReturnColumns() {
    return ["modifiedAt"] as (keyof Selectable<DB[TB]>)[];
  }

  getUpsertValues<Entity extends TimestampedEntity>(
    entity: Entity,
    getters: object = {}
  ): any {
    const values = { ...entity, ...getters } as any;
    delete values["createdAt"];
    delete values["modifiedAt"];
    return values;
  }

  getInsertReturnValues<Entity extends TimestampedEntity>(
    entity: Entity,
    returns: Partial<Selection<DB, TB, any>>,
    getters: object = {}
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
    returns: Partial<Selection<DB, TB, any>>,
    getters: object = {}
  ) {
    return {
      ...entity,
      ...getters,
      createdAt: entity.createdAt,
      modifiedAt: returns.modifiedAt,
    };
  }
}
