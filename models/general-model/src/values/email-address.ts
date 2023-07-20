import { CompilingStandardValidator } from "typebox-validators/standard/index.js";

import { EmailString } from "@fieldzoo/typebox-types";

import { validate } from "../utils/modeling-utils.js";

/**
 * Email address string.
 */

export type EmailAddress = string & { readonly __validated__: unique symbol };

export class EmailAddressImpl {
  static schema = EmailString({ maxLength: 100 });

  static castFrom(name: string, safely = true) {
    validate(this.#validator, name, "Invalid email address", safely);
    return name as EmailAddress;
  }

  static #validator = new CompilingStandardValidator(this.schema);
}
