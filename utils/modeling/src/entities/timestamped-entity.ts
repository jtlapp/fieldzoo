import { Type } from "@sinclair/typebox";

/**
 * Class representing a timestamped entity. Timestamps can be initially
 * undefined, as they are assigned after insert or update. This class
 * ensures that its clients don't have to worry about undefine values.
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
   * Returns the date/time at which the entity was created.
   * @returns The date/time at which the entity was created.
   * @throws If the entity has no creation date/time.
   */
  get createdAt(): Date {
    if (this.#createdAt === undefined) {
      throw new Error("User has no creation date");
    }
    return this.#createdAt;
  }

  /**
   * Returns the date/time at which the entity was last modified.
   * @returns The date/time at which the entity was last modified.
   * @throws If the entity has no modification date/time.
   */
  get modifiedAt(): Date {
    if (this.#modifiedAt === undefined) {
      throw new Error("User has no modification date");
    }
    return this.#modifiedAt;
  }

  /**
   * Sets the date/time at which the entity was last modified.
   * @param value The date/time at which the entity was last modified.
   * @returns The date/time at which the entity was last modified.
   */
  set modifiedAt(value: Date) {
    this.#modifiedAt = value;
  }
}
