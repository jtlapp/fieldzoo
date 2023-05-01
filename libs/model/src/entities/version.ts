import { Type } from "@sinclair/typebox";

import { VersionNumber, VersionNumberImpl } from "../values/version-number";
import { UserID, UserIDImpl } from "../values/user-id";

/**
 * Class representing a version entity.
 */
export class Version {
  static versionSchema = {
    createdAt: Type.Date(),
    modifiedAt: Type.Date(),
    modifiedBy: UserIDImpl.schema,
    version: VersionNumberImpl.schema,
  };

  /**
   * @param createdAt Date/time at which the entity was created.
   * @param modifiedAt Date/time at which the entity was last modified.
   * @param modifiedBy ID of the user who last modified the entity.
   * @param version Version number of the entity.
   */
  constructor(
    readonly createdAt: Date,
    readonly modifiedAt: Date,
    readonly modifiedBy: UserID,
    readonly version: VersionNumber
  ) {}
}
