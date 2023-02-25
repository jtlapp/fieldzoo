import { Generated } from "kysely";

export interface UserTable {
  id: Generated<number>;
  name: string;
  email: string;
}

export interface Database {
  users: UserTable;
}
