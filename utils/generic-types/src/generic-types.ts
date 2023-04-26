/**
 * Type matching only classes.
 */
export type ClassType<T> = { new (): T };

/**
 * Type consisting of all public non-function properties of T, where
 * public properties are those beginning with neither `#` nor `_`.
 */
export type Fields<T> = Pick<
  T,
  {
    [K in keyof T]: K extends PublicProperty<K>
      ? T[K] extends IsFunction<T[K]>
        ? never
        : K
      : never;
  }[keyof T]
>;

/**
 * Matches objects that are functions.
 */
export type IsFunction<T> = T extends (...args: any[]) => any ? T : never;

/**
 * Matches object properties beginning with neither `_` nor `#`.
 */
export type PublicProperty<P> = P extends `_${string}` ? never : P;

/**
 * Makes selective properties of an object optional.
 */
export type SelectivePartial<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

/**
 * Removes the `__validated__` symbol from a type, if present.
 */
export type Unvalidated<V> = V extends object ? Omit<V, "__validated__"> : V;

/**
 * Removes the `__validated__` symbol from all public non-function
 * properties of a type.
 */
export type UnvalidatedFields<O> = {
  [K in keyof Fields<O>]: Unvalidated<O[K]>;
};
