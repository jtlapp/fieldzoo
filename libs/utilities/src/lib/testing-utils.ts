/**
 * Generic testing utilities
 */

/**
 * Retrieve an error for examination. Modified from
 * https://stackoverflow.com/a/49512933/650894
 *
 * @param call Function that may throw an error; can be async
 * @returns The thrown error if one was thrown, otherwise returns
 *   the error NoErrorThrownError
 */
export async function getError<E>(call: () => unknown): Promise<E | null> {
  try {
    await call(); // need not be async
    return null;
  } catch (err: unknown) {
    return err as E;
  }
}
