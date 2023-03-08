/**
 * Type utilities.
 */

/**
 * Evaluates to a column name unless the column name is "*".
 */
// TODO: am I still using this?
export type NonAsterisk<Column> = Column extends "*" ? never : Column;

/**
 * Evaluates to the subset of a the given object having the keys in
 * the provided string array of key names.
 */
export type ObjectWithKeys<O, KeyArray extends string[]> = {
  [K in KeyArray[number]]: K extends keyof O ? O[K] : never;
};
