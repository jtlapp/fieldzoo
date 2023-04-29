import { Selectable } from "kysely";

import { TimestampedEntity } from "../entities/timestamped-entity";

// TODO: revisit how generic this is becoming
/**
 * Repository for persisting entities with `createdAt` and `modifiedAt`
 * timestamp columns. Several method take a `extraValues` object to allow
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

  getUpdateReturnColumns(extraColumns: string[] = []) {
    return ["modifiedAt"].concat(extraColumns) as (keyof Selectable<DB[TB]>)[];
  }

  getUpsertValues(entity: E, extraValues: object = {}) {
    const values = { ...entity, ...extraValues } as any;
    delete values["createdAt"];
    delete values["modifiedAt"];
    return values;
  }

  getInsertReturnValues(entity: E, returns: object, extraValues: object = {}) {
    return {
      ...entity,
      ...returns,
      ...extraValues,
    };
  }

  getUpdateReturnValues(entity: E, returns: object, extraValues: object = {}) {
    return {
      ...entity,
      ...returns,
      ...extraValues,
      createdAt: entity.createdAt,
    };
  }

  modifyForUpdate(entity: E, returns: object): E {
    for (const [key, value] of Object.entries(returns)) {
      entity[key as keyof E] = value as any;
    }
    return entity;
  }
}
