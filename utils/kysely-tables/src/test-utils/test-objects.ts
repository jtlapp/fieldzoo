import { Insertable } from "kysely";

import { Users } from "./test-tables";

export const USERS: Insertable<Users>[] = [
  {
    handle: "handle1",
    name: "Sue",
    email: "foo1@bar.com",
  },
  {
    handle: "handle2",
    name: "Fred",
    email: "foo2@bar.com",
  },
  {
    handle: "handle3",
    name: "Sue",
    email: "foo3@bar.com",
  },
];
