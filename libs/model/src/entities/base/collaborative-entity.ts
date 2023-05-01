import { UserID, UserIDImpl } from "../../values/user-id";
import { TimestampedEntity } from "@fieldzoo/modeling";
import { VersionNumber, VersionNumberImpl } from "../../values/version-number";

/**
 * Class representing a valid collaborative entity
 */
export class CollaborativeEntity extends TimestampedEntity {
  static collaborativeSchema = {
    version: VersionNumberImpl.schema,
    modifiedBy: UserIDImpl.schema,
  };

  /**
   * @param version The number for this version of the entity.
   * @param modifiedBy The ID of the user who last updated this entity.
   * @param createdAt The date/time at which the entity was created.
   * @param modifiedAt The date/time at which the entity was last modified.
   */
  constructor(
    public version: VersionNumber,
    public modifiedBy: UserID,
    createdAt?: Date,
    modifiedAt?: Date
  ) {
    super(createdAt, modifiedAt);
  }
}
