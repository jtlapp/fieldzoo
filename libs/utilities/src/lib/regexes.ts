/**
 * Regex matching strings suitable for non-handle user names.
 */
export const USER_NAME_REGEX =
  /^(?:\p{L}\p{M}*)+(?:(\. |[-.' ])(?:\p{L}\p{M}*)+\.?)*$/u;
