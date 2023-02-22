/**
 * Makes an object property read-only at runtime.
 *
 * @param obj Object containing field to freeze.
 * @param field Name of the property to make read only.
 */
export function freezeField(obj: object, field: string): void {
  Object.defineProperty(obj, field, {
    configurable: false,
    writable: false,
  });
}
