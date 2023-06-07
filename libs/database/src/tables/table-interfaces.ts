// NOTE: This file will ultimately be generated, so can't use special types.

import { Generated } from "kysely";

import { AuthUsers } from "./supabase-tables";

export interface Database {
  "auth.users": AuthUsers;
  user_profiles: UserProfiles;
  glossaries: Glossaries;
  glossary_versions: GlossaryVersions;
  terms: Terms;
  term_versions: TermVersions;
}

export interface UserProfiles {
  id: string;
  email: string;
  name: string | null;
  handle: string | null;
  createdAt: Date;
  modifiedAt: Date;
}

export interface Glossaries {
  id: string;
  versionNumber: number;
  ownerID: string;
  name: string;
  description: string | null;
  visibility: number;
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
  visibility: number;
  modifiedBy: string;
  createdAt: Date;
  modifiedAt: Date;
  whatChangedLine: string;
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
