// NOTE: This file will ultimately be generated, so can't use special types.

import { Generated } from "kysely";

export interface Database {
  users: Users;
  glossaries: Glossaries;
  terms: Terms;
}

export interface Users {
  id: Generated<number>;
  name: string;
  email: string;
}

export interface Glossaries {
  uuid: string;
  ownerId: number;
  name: string;
  description: string | null;
  updatedBy: number;
}

export interface Terms {
  id: Generated<number>;
  glossaryId: string;
  lookupName: string;
  displayName: string;
  description: string;
  updatedBy: number;
}
