import { Type } from "@sinclair/typebox";

import { VersionNumber, toVersionNumber } from "../values/version-number.js";
import {
  WhatChangedLine,
  toWhatChangedLine,
} from "../values/what-changed-line.js";
import { UserID, toUserID } from "../values/user-id.js";

/**
 * Class representing a version entity.
 */
export class VersionEntity {
  static versionSchema = {
    createdAt: Type.Date(),
    modifiedAt: Type.Date(),
    modifiedBy: toUserID.schema,
    versionNumber: toVersionNumber.schema,
    whatChangedLine: toWhatChangedLine.schema,
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
