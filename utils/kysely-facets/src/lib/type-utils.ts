/**
 * Type utilities.
 */

/**
 * Evaluates to the subset of a the given object having the keys in
 * the provided string array of key names.
 */
// prettier-ignore
export type ObjectWithKeys<O, KeyArray extends string[]> =
  KeyArray extends ["*"] ? O : {
    [K in KeyArray[number]]: K extends keyof O ? O[K] : never;
  };

// TODO: delete the following experiments when done

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
