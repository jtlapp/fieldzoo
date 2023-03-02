import { Insertable } from "kysely";

import { Users, Posts } from "./test-tables";

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

export const POSTS: Insertable<Posts>[] = [
  {
    userId: 0,
    title: "About Something",
    likeCount: 0,
  },
  {
    userId: 0,
    title: "And Another Thing",
    likeCount: 10,
  },
];
