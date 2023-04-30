// NOTE: This file will ultimately be generated, so can't use special types.

import { Generated } from "kysely";

export interface Database {
  users: Users;
  glossaries: Glossaries;
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
  ownerId: number;
  name: string;
  description: string | null;
  modifiedBy: number;
  createdAt: Date;
  modifiedAt: Date;
}

export interface Terms {
  id: Generated<number>;
  version: number;
  glossaryId: string;
  lookupName: string;
  displayName: string;
  description: string;
  modifiedBy: number;
  createdAt: Date;
  modifiedAt: Date;
}

export interface TermVersions {
  id: number;
  version: number;
  glossaryId: string;
  displayName: string;
  description: string;
  modifiedBy: number;
  createdAt: Date;
  modifiedAt: Date;
  whatChangedLine: string;
}
