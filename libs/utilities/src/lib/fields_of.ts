/**
 * Matches object properties beginning with neither `_` nor `#`.
 */
export type PublicProperty<P> = P extends `_${string}` ? never : P;

/**
 * Matches objects that are functions.
 */
export type IsFunction<T> = T extends (...args: any[]) => any ? T : never;

/**
 * Type consisting of all public non-function properties of T, where
 * public properties are those beginning with neither `#` nor `_`.
 */
export type FieldsOf<T> = Pick<
  T,
  {
    [K in keyof T]: K extends PublicProperty<K>
      ? T[K] extends IsFunction<T[K]>
        ? never
        : K
      : never;
  }[keyof T]
>;
