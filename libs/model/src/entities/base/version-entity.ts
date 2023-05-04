import { Type } from "@sinclair/typebox";

import { VersionNumber, VersionNumberImpl } from "../../values/version-number";
import { UserID, UserIDImpl } from "../../values/user-id";
import {
  WhatChangedLine,
  WhatChangedLineImpl,
} from "../../values/what-changed-line";

/**
 * Class representing a version entity.
 */
export class VersionEntity {
  static versionSchema = {
    createdAt: Type.Date(),
    modifiedAt: Type.Date(),
    modifiedBy: UserIDImpl.schema,
    versionNumber: VersionNumberImpl.schema,
    whatChangedLine: WhatChangedLineImpl.schema,
  };

  /**
   * @param createdAt Date/time at which the entity was created.
   * @param modifiedAt Date/time at which the entity was last modified.
   * @param modifiedBy ID of the user who last modified the entity.
   * @param versionNumber Version number of the entity.
   * @param whatChangedLine Line describing what changed in this version.
   */
  constructor(
    readonly createdAt: Date,
    readonly modifiedAt: Date,
    readonly modifiedBy: UserID,
    readonly versionNumber: VersionNumber,
    readonly whatChangedLine: WhatChangedLine
  ) {}
}
