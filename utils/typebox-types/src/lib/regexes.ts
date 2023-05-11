/**
 * Regexes for use by Field Zoo.
 */

/**
 * Regex matching ASCII code words, beginning with an underscore or letter
 * and containing only underscores, letters, and digits.
 */
export const CODE_WORD_REGEX = /^[_A-Za-z][_A-Za-z0-9]*$/;

/**
 * Regex matching a hex string.
 */
export const HEX_REGEX = /^[0-9a-fA-F]+$/;

/**
 * Regex matching a host name, sans port and protocol.
 * (adapted from https://stackoverflow.com/a/106223/650894)
 */
export const HOST_NAME_REGEX =
  /^(([a-zA-Z0-9]|[a-zA-Z0-9][-a-zA-Z0-9]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][-A-Za-z0-9]*[A-Za-z0-9])$/;

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
 * Regex matching a user handle. Unicode characters are not allowed at the
 * moment because care needs to be taken to ensure that distinct handles are
 * distinct looking. It's important that people be able to clearly identify
 * each other's handles.
 */
export const USER_HANDLE_REGEX = /^[A-Za-z][A-Za-z0-9]*(_[A-Za-z0-9]+)*$/;

/**
 * Regex matching strings suitable for non-handle user names.
 */
export const USER_NAME_UNICODE_REGEX =
  /^(?:\p{L}\p{M}*)+(?:(\. |[-.' ])(?:\p{L}\p{M}*)+\.?)*$/u;
