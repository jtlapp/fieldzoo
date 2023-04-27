import { MultitierValidator } from "@fieldzoo/multitier-validator";
import { EmailString } from "@fieldzoo/typebox-types";

/**
 * Email address string.
 */

export type EmailAddress = string & { readonly __validated__: unique symbol };

export class EmailAddressImpl {
  static schema = EmailString({ maxLength: 100 });

  static castFrom(name: string, safely = true) {
    this.#validator.validate(name, "Invalid email address", safely);
    return name as EmailAddress;
  }

  static #validator = new MultitierValidator(this.schema);
}
