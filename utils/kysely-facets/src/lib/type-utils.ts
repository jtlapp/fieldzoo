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
// prettier-ignore
export type ObjectWithKeys<O, KeyArray extends string[]> =
  KeyArray extends ["*"] ? O : {
    [K in KeyArray[number]]: K extends keyof O ? O[K] : never;
  };

// prettier-ignore
// export type ObjectWithKeys<O, KeyArray extends string[]> =
//   KeyArray extends ["*"] ? O : {
//     [K in KeyArray[number] & keyof O]: O[K];
//   };

// This always returns all columns
// prettier-ignore
// export type ObjectWithKeys<O, KeyArray extends string[]> = {
//   [K in keyof O & string]: KeyArray extends ["*"]
//     ? O[K]
//     : (K extends KeyArray[number] ? O[K] : never);
// };
