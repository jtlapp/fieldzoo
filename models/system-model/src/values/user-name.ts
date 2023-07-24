import { CompilingStandardValidator } from "typebox-validators";

import { UserNameUnicodeString } from "@fieldzoo/typebox-types";
import { validate } from "@fieldzoo/general-model";

/**
 * Account name of a user who can login
 */

export type UserName = string & { readonly __validated__: unique symbol };

const schema = UserNameUnicodeString({
  minLength: 2,
  maxLength: 50,
});
const validator = new CompilingStandardValidator(schema);

export function toUserName(name: string, safely = true) {
  validate(validator, name, "Invalid user name", safely);
  return name as UserName;
}
toUserName.schema = schema;
