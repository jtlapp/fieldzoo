import { VersionNumber } from "../values/version-number";

/**
 * Base class for versions of timestamped entities.
 */
export class TimestampedVersion {
  constructor(
    readonly createdAt: Date,
    readonly modifiedAt: Date,
    readonly versionNumber: VersionNumber
  ) {}
}
