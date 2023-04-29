import { Selectable } from "kysely";

import { TimestampedEntity } from "../entities/timestamped-entity";

/**
 * Repository for persisting entities with `createdAt` and `modifiedAt`
 * timestamp columns. Several method take a `getters` object to allow
 * the caller to assign getter properties, which are not otherwise
 * copied from the provided entity.
 */
export abstract class TimestampedRepo<
  DB,
  TB extends keyof DB,
  E extends TimestampedEntity
> {
  getInsertReturnColumns(extraColumns: string[] = []) {
    return ["createdAt", "modifiedAt"].concat(
      extraColumns
    ) as (keyof Selectable<DB[TB]>)[];
  }

  getUpdateReturnColumns() {
    return ["modifiedAt"] as (keyof Selectable<DB[TB]>)[];
  }

  getUpsertValues(entity: E, getters: object = {}) {
    const values = { ...entity, ...getters } as any;
    delete values["createdAt"];
    delete values["modifiedAt"];
    return values;
  }

  getInsertReturnValues(
    entity: E,
    returns: { createdAt: Date; modifiedAt: Date },
    getters: object = {}
  ) {
    return {
      ...entity,
      ...getters,
      createdAt: returns.createdAt,
      modifiedAt: returns.modifiedAt,
    };
  }

  getUpdateReturnValues(
    entity: E,
    returns: { modifiedAt: Date },
    getters: object = {}
  ) {
    return {
      ...entity,
      ...getters,
      createdAt: entity.createdAt,
      modifiedAt: returns.modifiedAt,
    };
  }

  modifyForUpdate(entity: E, returns: { modifiedAt: Date }): E {
    entity.modifiedAt = returns.modifiedAt;
    return entity;
  }
}
