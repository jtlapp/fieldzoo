// NOTE: This file will ultimately be generated, so can't use special types.

import { ColumnType, Generated } from "kysely";

export interface Database {
  users: Users;
  email_verifications: EmailVerifications;
  password_resets: PasswordResets;
  glossaries: Glossaries;
  glossary_versions: GlossaryVersions;
  user_glossary_permissions: UserGlossaryPermissions;
  terms: Terms;
  term_versions: TermVersions;
}

export interface Users {
  id: string;
  email: string;
  emailVerified: boolean;
  displayName: string | null;
  userHandle: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  modifiedAt: Date;
  disabledAt: Date | null;
}

export interface EmailVerifications {
  token: string;
  userID: string;
  expiresAt: ColumnType<bigint, number>;
}

export interface PasswordResets {
  token: string;
  userID: string;
  expiresAt: ColumnType<bigint, number>;
}

export interface Glossaries {
  id: string;
  versionNumber: number;
  ownerID: string;
  name: string;
  description: string | null;
  modifiedBy: string;
  createdAt: Date;
  modifiedAt: Date;
}

export interface GlossaryVersions {
  glossaryID: string;
  versionNumber: number;
  ownerID: string;
  name: string;
  description: string | null;
  modifiedBy: string;
  createdAt: Date;
  modifiedAt: Date;
  whatChangedLine: string;
}

export interface UserGlossaryPermissions {
  userID: string;
  glossaryID: string;
  permissions: number;
}

export interface Terms {
  id: Generated<number>;
  versionNumber: number;
  glossaryID: string;
  lookupName: string;
  displayName: string;
  description: string;
  modifiedBy: string;
  createdAt: Date;
  modifiedAt: Date;
}

export interface TermVersions {
  termID: number;
  versionNumber: number;
  glossaryID: string;
  displayName: string;
  description: string;
  modifiedBy: string;
  createdAt: Date;
  modifiedAt: Date;
  whatChangedLine: string;
}
