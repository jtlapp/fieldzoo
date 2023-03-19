import { Generated } from "kysely";

export interface Users {
  id: Generated<number>;
  name: string;
  email: string;
}

export interface Database {
  users: Users;
}
