/**
 * Type utilities.
 */

// TODO: drop types I'm not using

import { Selectable, SelectExpression, SelectType } from "kysely";

import {
  AllSelection,
  ExtractTypeFromStringSelectExpression,
} from "./kysely-types";

/**
 * Evaluates to a type containing all possible selectable columns,
 * including aliased columns.
 */
export type AllColumns<
  DB,
  TableName extends keyof DB & string,
  ColumnAliases extends string[]
> = AllSelection<DB, TableName> & AliasedSubset<DB, TableName, ColumnAliases>;

/**
 * Evaluates to a union of all provided alias names.
 */
export type AliasNames<ColumnAliases extends string[]> =
  ColumnAliases extends []
    ? never
    : ColumnAliases[number] extends `${string} as ${infer A}`
    ? A
    : never;

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
 * Type of the primary key tuple whose column names are given by `KA` and are
 * found in the table interface `T`. Supports up to 4 columns.
 * @typeparam T Table interface.
 * @typeparam KA Array of the primary key column names.
 */
export type KeyTuple<
  T,
  KA extends (keyof Selectable<T> & string)[]
> = Selectable<T>[KA[3]] extends string
  ? [
      Selectable<T>[KA[0]],
      Selectable<T>[KA[1]],
      Selectable<T>[KA[2]],
      Selectable<T>[KA[3]]
    ]
  : Selectable<T>[KA[2]] extends string
  ? [Selectable<T>[KA[0]], Selectable<T>[KA[1]], Selectable<T>[KA[2]]]
  : Selectable<T>[KA[1]] extends string
  ? [Selectable<T>[KA[0]], Selectable<T>[KA[1]]]
  : [Selectable<T>[KA[0]]];

/**
 * Evaluates to the subset of a the given object having the keys in
 * the provided string array of key names.
 */
export type ObjectWithKeys<O, KeyArray extends string[]> = {
  [K in KeyArray[number]]: K extends keyof O ? O[K] : never;
};

/**
 * Shorthand type for a selectable column.
 */
export type SelectableColumn<T> = keyof Selectable<T> & string;

/**
 * Tuple of up to four selectable columns.
 */
export type SelectableColumnTuple<T> =
  | [SelectableColumn<T>]
  | [SelectableColumn<T>, SelectableColumn<T>]
  | [SelectableColumn<T>, SelectableColumn<T>, SelectableColumn<T>]
  | [
      SelectableColumn<T>,
      SelectableColumn<T>,
      SelectableColumn<T>,
      SelectableColumn<T>
    ];

/**
 * Evaluates to an object consisting only of aliased columns.
 */
type AliasedSubset<
  DB,
  TableName extends keyof DB & string,
  ColumnAliases extends string[]
> = ColumnAliases extends []
  ? object
  : {
      [A in ColumnAliases[number] extends `${string} as ${infer A}`
        ? A
        : never]: SelectType<
        ExtractTypeFromStringSelectExpression<
          DB,
          TableName,
          ColumnAliases[number],
          A
        >
      >;
    };
