// NOTE: This file will ultimately be generated, so can't use special types.

import { Generated } from "kysely";

export interface Database {
  users: Users;
  glossaries: Glossaries;
  glossary_versions: GlossaryVersions;
  terms: Terms;
  term_versions: TermVersions;
}

export interface Users {
  id: Generated<number>;
  name: string;
  email: string;
  createdAt: Date;
  modifiedAt: Date;
}

export interface Glossaries {
  uuid: string;
  versionNumber: number;
  ownerID: number;
  name: string;
  description: string | null;
  modifiedBy: number;
  createdAt: Date;
  modifiedAt: Date;
}

export interface GlossaryVersions {
  uuid: string;
  versionNumber: number;
  ownerID: number;
  name: string;
  description: string | null;
  modifiedBy: number;
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
  modifiedBy: number;
  createdAt: Date;
  modifiedAt: Date;
}

export interface TermVersions {
  id: number;
  versionNumber: number;
  glossaryID: string;
  displayName: string;
  description: string;
  modifiedBy: number;
  createdAt: Date;
  modifiedAt: Date;
  whatChangedLine: string;
}
