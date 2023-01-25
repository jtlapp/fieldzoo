/**
 * Regex matching a one or more lines of Unicode, with first and last lines
 * non-empty, permitting repeating spaces and line feeds ("\n").
 */
export const MULTI_LINE_UNICODE_REGEX =
  /^[^\p{Z}\p{C}]+(?:[ \n]+[^\p{Z}\p{C}]+)*$/u;

/**
 * Regex matching a single non-empty line of Unicode, with no double-spaces.
 */
export const SINGLE_LINE_UNICODE_REGEX =
  /^[^\p{Z}\p{C}]+(?: [^\p{Z}\p{C}]+)*$/u;

/**
 * Regex matching strings suitable for non-handle user names.
 */
export const USER_NAME_REGEX =
  /^(?:\p{L}\p{M}*)+(?:(\. |[-.' ])(?:\p{L}\p{M}*)+\.?)*$/u;
