/**
 * Type utilities.
 */

import { SelectExpression, SelectType } from "kysely";

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
 * Evaluates to the subset of a the given object having the keys in
 * the provided string array of key names.
 */
export type ObjectWithKeys<O, KeyArray extends string[]> = {
  [K in KeyArray[number]]: K extends keyof O ? O[K] : never;
};

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
