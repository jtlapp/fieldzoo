import { SchemaOptions, StringOptions, TSchema, Type } from "@sinclair/typebox";
import { TypeSystem } from "@sinclair/typebox/system";

export const EmptyStringable = <T extends TSchema>(
  type: T,
  options?: StringOptions
) => Type.Union([type, Type.Literal("")], options);

export const IntegerString = TypeSystem.Type<
  string,
  { minimum?: number; maximum?: number; maxDigits?: number } & SchemaOptions
>("IntegerString", (options, value) => {
  if (
    typeof value !== "string" ||
    (options.maxDigits !== undefined && value.length > options.maxDigits) ||
    !/^[0-9]+$/.test(value)
  ) {
    return false;
  }
  const integer = parseInt(value);
  return (
    (options.minimum === undefined || integer >= options.minimum) &&
    (options.maximum === undefined || integer <= options.maximum)
  );
});

export const NonEmptyString = (options?: StringOptions) =>
  Type.String({ minLength: 1, ...options });

export const Nullable = <T extends TSchema>(type: T) =>
  Type.Union([type, Type.Null()]);

export const Zeroable = <T extends TSchema>(type: T) =>
  Type.Union([type, Type.Literal(0)]);
