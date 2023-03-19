// NOTE: This file will ultimately be generated, so can't use special types.

import { Generated } from "kysely";

export interface Users {
  id: Generated<number>;
  name: string;
  email: string;
}

export interface Glossaries {
  uuid: string;
  ownerID: number;
  name: string;
  description: string | null;
}

export interface Database {
  users: Users;
  glossaries: Glossaries;
}
