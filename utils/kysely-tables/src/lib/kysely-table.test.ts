import { Kysely } from "kysely";

import { createDB, resetDB, destroyDB } from "../test-utils/test-setup";
import { Database, UserTable } from "../test-utils/test-tables";

let db: Kysely<Database>;
let userTable: UserTable;

beforeAll(async () => {
  db = await createDB();
  userTable = new UserTable(db);
});
beforeEach(() => resetDB(db));
afterAll(() => destroyDB(db));

const USER1 = {
  handle: "handle1",
  email: "foo1@bar.com",
};
const USER2 = {
  handle: "handle2",
  email: "foo2@bar.com",
};

describe("tables with unique keys", () => {
  it("inserts, selects, updates, and deletes objects by ID", async () => {
    // Add users
    const user1 = await userTable.insertOne(USER1);
    const user2 = await userTable.insertOne(USER2);

    // Update a user
    const NEW_EMAIL = "new@baz.com";
    user2.email = NEW_EMAIL;
    await userTable.updateById(user2);

    // Retrieves a user by ID
    const readUser2 = await userTable.selectById(user2.id);
    expect(readUser2?.handle).toEqual(USER2.handle);
    expect(readUser2?.email).toEqual(NEW_EMAIL);

    // Delete a user
    const deleted = await userTable.deleteById(user2.id);
    expect(deleted).toEqual(true);

    // Verify correct user was deleted
    const readUser1 = await userTable.selectById(user1.id);
    expect(readUser1?.handle).toEqual(USER1.handle);
    const noUser = await userTable.selectById(user2.id);
    expect(noUser).toBeNull();
  });
});

describe("row queries", () => {
  it("inserts, selects, updates, and deletes objects by row query", async () => {
    // Add users by row query
    const user1 = (await userTable
      .insertRows()
      .values(USER1)
      .returningAll()
      .executeTakeFirst())!;
    const user2 = (await userTable
      .insertRows()
      .values(USER2)
      .returningAll()
      .executeTakeFirst())!;

    // Update a user by row query
    const NEW_EMAIL = "new@baz.com";
    user2.email = NEW_EMAIL;
    await userTable
      .updateRows()
      .set(user2)
      .where("id", "=", user2.id)
      .execute();

    // Retrieves user by row query
    const readUser2 = await userTable
      .selectRows()
      .where("id", "=", user2.id)
      .executeTakeFirst();
    expect(readUser2?.handle).toEqual(USER2.handle);
    expect(readUser2?.email).toEqual(NEW_EMAIL);

    // Delete user by row query
    await userTable.deleteRows().where("id", "=", user2.id).execute();

    // Verify correct user was deleted
    const readUser1 = await userTable.selectById(user1.id);
    expect(readUser1?.handle).toEqual(USER1.handle);
    const noUser = await userTable.selectById(user2.id);
    expect(noUser).toBeNull();
  });
});
