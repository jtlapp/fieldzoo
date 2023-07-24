import { TimestampedEntity } from "@fieldzoo/general-model";

import { VersionNumber, toVersionNumber } from "../values/version-number.js";
import { UserID, toUserID } from "../values/user-id.js";

/**
 * Class representing a valid collaborative entity
 */
export class CollaborativeEntity extends TimestampedEntity {
  static collaborativeSchema = {
    versionNumber: toVersionNumber.schema,
    modifiedBy: toUserID.schema,
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
