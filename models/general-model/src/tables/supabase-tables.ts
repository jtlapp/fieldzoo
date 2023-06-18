/**
 * Interfaces for Supabase-provided tables.
 */

export interface AuthUsers {
  id: string;
  email: string;
  last_sign_in_at: Date;
  banned_until: Date | null;
  deleted_at: Date | null;
}
