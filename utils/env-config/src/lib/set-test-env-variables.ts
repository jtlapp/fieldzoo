/**
 * Assigns all environment variables in the provided list, setting them to the
 * corresponding value in the provided object, or deleting them if the value
 * is non-existant or undefined in the object.
 */
export function setTestEnvVariables<V extends string[]>(
  varNames: V,
  vars: Record<V[number], string | undefined>
) {
  for (const varName of varNames) {
    const value = vars[varName as keyof typeof vars];
    if (value === undefined) {
      delete process.env[varName];
    } else {
      process.env[varName] = value;
    }
  }
}
