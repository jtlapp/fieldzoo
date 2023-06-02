import { TSchema } from "@sinclair/typebox";
import { AbstractValidator } from "typebox-validators";

export function validate<S extends TSchema>(
  validator: AbstractValidator<S>,
  value: Readonly<unknown>,
  overallMessage: string,
  safely = true
) {
  if (safely) {
    validator.assert(value, overallMessage);
  } else {
    validator.validate(value, overallMessage);
  }
}
