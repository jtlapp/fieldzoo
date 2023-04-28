import { Type } from "@sinclair/typebox";

export type TimestampedColumns = "createdAt" | "modifiedAt";

/**
 * Class representing a timestamped entity. Timestamps can be initially
 * undefined, as they are assigned after insert or update.
 */
export class TimestampedEntity {
  #createdAt?: Date;
  #modifiedAt?: Date;

  static timestampedSchema = {
    createdAt: Type.Optional(Type.Date()),
    modifiedAt: Type.Optional(Type.Date()),
  };

  /**
   * @param createdAt Date/time at which the entity was created.
   * @param modifiedAt Date/time at which the entity was last modified.
   */
  constructor(createdAt?: Date, modifiedAt?: Date) {
    this.#createdAt = createdAt;
    this.#modifiedAt = modifiedAt;
  }

  /**
   * Returns the date on which the entity was created.
   * @returns The date on which the entity was created.
   */
  get createdAt(): Date {
    if (this.#createdAt === undefined) {
      throw new Error("User has no creation date");
    }
    return this.#createdAt;
  }

  /**
   * Returns the date on which the entity was last modified.
   * @returns The date on which the entity was last modified.
   */
  get modifiedAt(): Date {
    if (this.#modifiedAt === undefined) {
      throw new Error("User has no modification date");
    }
    return this.#modifiedAt;
  }
}
