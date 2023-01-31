import { ValidateBy, ValidationOptions, buildMessage } from "class-validator";

/**
 * Custom `class-validator` validator for checking whether a number is
 * within a specified range. Improves on the existing `@Min` and `@Max`
 * decorators by having error messages report the expected range.
 *
 * @param min Minimum allowed value
 * @param max Maximum allowed value
 */

export function InRange(
  min: number,
  max: number,
  validationOptions?: ValidationOptions
): PropertyDecorator {
  return ValidateBy(
    {
      name: "inRange",
      constraints: [min, max],
      validator: {
        validate: (value, _args) => {
          return typeof value === "number" && value >= min && value <= max;
        },
        defaultMessage: buildMessage(
          (eachPrefix) =>
            eachPrefix +
            "$property must be a number >= $constraint1 and <= $constraint2",
          validationOptions
        ),
      },
    },
    validationOptions
  );
}
