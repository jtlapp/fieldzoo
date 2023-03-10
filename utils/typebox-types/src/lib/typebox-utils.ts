import { StringOptions, TSchema, Type } from "@sinclair/typebox";

export const NonEmptyString = (options?: StringOptions<string>) =>
  Type.String({ minLength: 1, ...options });

export const Nullable = <T extends TSchema>(type: T) =>
  Type.Union([type, Type.Null()]);
