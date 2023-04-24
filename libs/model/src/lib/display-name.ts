import { InvalidValueError } from "@fieldzoo/safe-validator";
import { SINGLE_LINE_UNICODE_REGEX } from "@fieldzoo/typebox-types";

/**
 * Displayable entity name, not necessarily normalized.
 */

export type DisplayName = string & { readonly __typeID: unique symbol };

export function createDisplayName(name: string) {
  if (name.match(SINGLE_LINE_UNICODE_REGEX) === null) {
    throw new InvalidValueError("Invalid display name");
  }
  return name as DisplayName;
}
