/**
 * Type utilities.
 */

import { Selectable } from "kysely";

/**
 * Evaluates to the subset of a the given object having the keys in
 * the provided string array of key names.
 */
// prettier-ignore
export type ObjectWithKeys<O, KeyArray extends string[]> =
  KeyArray extends ["*"] ? O : {
    [K in KeyArray[number]]: K extends keyof O ? O[K] : never;
  };

// export type ObjectWithKeys<O, KeyArray extends string[]> =
//   KeyArray extends ["*"] ? O : {
//     [K in KeyArray[number] & keyof O]: O[K];
//   };

// This always returns all columns
// export type ObjectWithKeys<O, KeyArray extends string[]> = {
//   [K in keyof O & string]: KeyArray extends ["*"]
//     ? O[K]
//     : (K extends KeyArray[number] ? O[K] : never);
// };

/**
 * Type of a function that transforms a row into a SelectedObject.
 */
export type SelectTransform<DB, TableName extends keyof DB & string, O> = (
  row: Selectable<DB[TableName]>
) => O;
