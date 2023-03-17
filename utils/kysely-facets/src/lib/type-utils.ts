/**
 * Type utilities.
 */

import { AnyColumn, Selectable, SelectExpression } from "kysely";

// import {
//   ExtractTypeFromStringReference,
//   SelectExpression,
//   SelectType,
// } from "kysely";

/**
 * Evaluates to a type containing all possible query result columns.
 */
// export type AllColumns<DB, TableName extends keyof DB & string> = {
//   [K in SelectExpression<DB, TableName> & string]: SelectType<
//     ExtractTypeFromStringReference<DB, TableName, K>
//   >;
// };

// copied from Kysely
export type AllSelection<DB, TB extends keyof DB> = Selectable<{
  [C in AnyColumn<DB, TB>]: {
    [T in TB]: C extends keyof DB[T] ? DB[T][C] : never;
  }[TB];
}>;

/**
 * String representing a column alias in the form
 * "column-or-column-reference as alias".
 */
export type ColumnAlias<
  DB,
  TableName extends keyof DB & string
> = SelectExpression<DB, TableName> & `${string} as ${string}`;

/**
 * Type representing an empty object. Use for clarity.
 */
export type EmptyObject = Record<string, never>;

/**
 * Evaluates to the subset of a the given object having the keys in
 * the provided string array of key names.
 */
export type ObjectWithKeys<O, KeyArray extends string[]> = {
  [K in KeyArray[number]]: K extends keyof O ? O[K] : never;
};
