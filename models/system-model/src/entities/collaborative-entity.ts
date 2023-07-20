import { TimestampedEntity } from "@fieldzoo/general-model";

import { VersionNumber, VersionNumberImpl } from "../values/version-number.js";
import { UserID, UserIDImpl } from "../values/user-id.js";

/**
 * Class representing a valid collaborative entity
 */
export class CollaborativeEntity extends TimestampedEntity {
  static collaborativeSchema = {
    versionNumber: VersionNumberImpl.schema,
    modifiedBy: UserIDImpl.schema,
  };

  /**
   * @param versionNumber The number for this version of the entity.
   * @param modifiedBy The ID of the user who last updated this entity.
   * @param createdAt The date/time at which the entity was created.
   * @param modifiedAt The date/time at which the entity was last modified.
   */
  constructor(
    public versionNumber: VersionNumber,
    public modifiedBy: UserID,
    createdAt?: Date,
    modifiedAt?: Date
  ) {
    super(createdAt, modifiedAt);
  }
}
