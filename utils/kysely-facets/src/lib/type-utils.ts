/**
 * Type utilities.
 */

/**
 * Evaluates to the subset of a the given object having the keys in
 * the provided string array of key names.
 */
export type ObjectWithKeys<O, KeyArray extends string[]> = {
  [K in KeyArray[number]]: K extends keyof O ? O[K] : never;
};
