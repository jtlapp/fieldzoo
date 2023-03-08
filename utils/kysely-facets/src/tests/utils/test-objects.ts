import { Insertable } from "kysely";

import { Users, Posts } from "./test-tables";
import {
  InsertedUser,
  InsertReturnedUser,
  SelectedUser,
  UpdatedUser,
} from "./test-types";

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
  {
    userId: 0,
    title: "Still One More Thing",
    likeCount: 1000,
  },
];

export const selectedUser1 = new SelectedUser(
  1,
  "John",
  "Smith",
  "jsmith",
  "jsmith@xyz.pdq"
);
export const selectedUser2 = new SelectedUser(
  2,
  "Jane",
  "Doe",
  "jdoe",
  "jdoe@xyz.pdq"
);

export const insertedUser1 = new InsertedUser(
  0,
  "John",
  "Smith",
  "jsmith",
  "jsmith@xyz.pdq"
);
export const insertedUser2 = new InsertedUser(
  0,
  "Jane",
  "Doe",
  "jdoe",
  "jdoe@xyz.pdq"
);
export const insertedUser3 = new InsertedUser(
  0,
  "Mary",
  "Sue",
  "msue",
  "msue@xyz.pdq"
);

export const insertReturnedUser1 = new InsertReturnedUser(
  1,
  "John",
  "Smith",
  "jsmith",
  "jsmith@xyz.pdq"
);
export const insertReturnedUser2 = new InsertReturnedUser(
  2,
  "Jane",
  "Doe",
  "jdoe",
  "jdoe@xyz.pdq"
);
export const insertReturnedUser3 = new InsertReturnedUser(
  3,
  "Mary",
  "Sue",
  "msue",
  "msue@xyz.pdq"
);

export const updatedUser1 = new UpdatedUser(
  0,
  "John",
  "Smith",
  "jsmith",
  "jsmith@xyz.pdq"
);
export const updatedUser2 = new UpdatedUser(
  2,
  "Jane",
  "Doe",
  "jdoe",
  "jdoe@xyz.pdq"
);
