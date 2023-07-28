import { CompilingStandardValidator } from "typebox-validators";

import { UserDisplayNameUnicodeString } from "@fieldzoo/typebox-types";
import { validate } from "@fieldzoo/general-model";

/**
 * Account name of a user who can login
 */

export type UserDisplayName = string & {
  readonly __validated__: unique symbol;
};

const schema = UserDisplayNameUnicodeString({
  minLength: 2,
  maxLength: 50,
});
const validator = new CompilingStandardValidator(schema);

export function toUserDisplayName(name: string, safely = true) {
  validate(validator, name, "Invalid user name", safely);
  return name as UserDisplayName;
}
toUserDisplayName.schema = schema;
