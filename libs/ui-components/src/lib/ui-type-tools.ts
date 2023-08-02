import { Readable } from "svelte/motion";

/**
 * Evaluates to the type of value that a store holds, if it's a store;
 * otherwise, evaluates to the type itself.
 */
export type StoreValue<S> = S extends Readable<infer V> ? V : S;

/**
 * Evaluates to the type of the value of a Melt UI builder property.
 * Stores evaluate to the type of value they hold.
 */
// TODO: delete if no longer needed or usable
export type MeltValue<
  T extends (...args: any[]) => any,
  P extends keyof ReturnType<T>
> = StoreValue<ReturnType<T>[P]>;
