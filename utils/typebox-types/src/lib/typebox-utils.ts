import { StringOptions, TSchema, Type } from "@sinclair/typebox";

export const NonEmptyString = (options?: StringOptions<string>) =>
  Type.String({ minLength: 1, ...options });

export const EmptyStringable = <T extends TSchema>(type: T) =>
  Type.Union([type, Type.Literal("")]);

export const Nullable = <T extends TSchema>(type: T) =>
  Type.Union([type, Type.Null()]);

export const Zeroable = <T extends TSchema>(type: T) =>
  Type.Union([type, Type.Literal(0)]);
