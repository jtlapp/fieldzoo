import { CompilingStandardValidator } from "typebox-validators/standard/index.js";

import { EmailString } from "@fieldzoo/typebox-types";

import { validate } from "../utils/modeling-utils.js";

/**
 * Email address string.
 */

export type EmailAddress = string & { readonly __validated__: unique symbol };

const schema = EmailString({ maxLength: 100 });
const validator = new CompilingStandardValidator(schema);

export function toEmailAddress(name: string, safely = true) {
  validate(validator, name, "Invalid email address", safely);
  return name as EmailAddress;
}
toEmailAddress.schema = schema;
