/**
 * Database-independent representation of a row or object ID
 */
export type RecordID = string & { readonly "": unique symbol };
