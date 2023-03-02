import { Kysely, sql } from "kysely";

import { createDB, resetDB, destroyDB } from "../test-utils/test-setup";
import { Database, UserTable, PostTable } from "../test-utils/test-tables";
import { USERS, POSTS } from "../test-utils/test-objects";

let db: Kysely<Database>;
let userTable: UserTable;
let postTable: PostTable;

beforeAll(async () => {
  db = await createDB();
  userTable = new UserTable(db);
  postTable = new PostTable(db);
});
beforeEach(() => resetDB(db));
afterAll(() => destroyDB(db));

describe("row queries", () => {
  it("inserts, selects, updates, and deletes objects by row query", async () => {
    // Add users by row query
    const user0 = (await userTable
      .insertRows()
      .values(USERS[0])
      .returningAll()
      .executeTakeFirst())!;
    const user1 = (await userTable
      .insertRows()
      .values(USERS[1])
      .returningAll()
      .executeTakeFirst())!;

    // Update a user by row query
    const NEW_EMAIL = "new@baz.com";
    user1.email = NEW_EMAIL;
    await userTable
      .updateRows()
      .set(user1)
      .where("id", "=", user1.id)
      .execute();

    // Retrieves user by row query
    const readUser1 = await userTable
      .selectRows()
      .where("id", "=", user1.id)
      .executeTakeFirst();
    expect(readUser1?.handle).toEqual(USERS[1].handle);
    expect(readUser1?.email).toEqual(NEW_EMAIL);

    // Delete user by row query
    await userTable.deleteRows().where("id", "=", user1.id).execute();

    // Verify correct user was deleted
    const readUser0 = await userTable.selectById(user0.id);
    expect(readUser0?.handle).toEqual(USERS[0].handle);
    const noUser = await userTable.selectById(user1.id);
    expect(noUser).toBeNull();
  });
});

describe("insertion", () => {
  it("insertOne() inserts a row", async () => {
    const result = await userTable.insertOne(USERS[0]);
    expect(result).toBeUndefined();

    const readUser0 = await userTable
      .selectRows()
      .where("email", "=", USERS[0].email)
      .executeTakeFirst();
    expect(readUser0?.email).toEqual(USERS[0].email);
  });

  it("insertOne() returning indicated columns", async () => {
    const updatedUser = await userTable.insertOne(USERS[0], ["id"]);
    expect(updatedUser.id).toBeGreaterThan(0);
    expect(Object.keys(updatedUser).length).toEqual(1);

    const readUser0 = await userTable
      .selectRows()
      .where("id", "=", updatedUser.id)
      .executeTakeFirst();
    expect(readUser0?.email).toEqual(USERS[0].email);

    const post0 = Object.assign({}, POSTS[0], { userId: updatedUser.id });
    const updatedPost = await postTable.insertOne(post0, ["id", "createdAt"]);
    expect(updatedPost.id).toBeGreaterThan(0);
    expect(new Date(updatedPost.createdAt)).not.toBeNaN();
    expect(Object.keys(updatedPost).length).toEqual(2);

    const readPost0 = await postTable
      .selectRows()
      .where("id", "=", updatedPost.id)
      .where("createdAt", "=", updatedPost.createdAt)
      .executeTakeFirst();
    expect(readPost0?.title).toEqual(post0.title);
  });

  it("insertOne() returning all columns", async () => {
    const updatedUser = await userTable.insertOne(USERS[0], ["*"]);
    expect(updatedUser.id).toBeGreaterThan(0);
    expect(updatedUser.handle).toEqual(USERS[0].handle);
    expect(updatedUser.name).toEqual(USERS[0].name);
    expect(updatedUser.email).toEqual(USERS[0].email);
    expect(Object.keys(updatedUser).length).toEqual(4);
  });
});

describe("selection", () => {
  it("selectMany() selects the required rows", async () => {
    for (const user of USERS) {
      await userTable.insertOne(user);
    }

    // Test selecting all
    let users = await userTable.selectMany();
    expect(users.length).toEqual(3);
    expect(users[0].handle).toEqual(USERS[0].handle);
    expect(users[1].handle).toEqual(USERS[1].handle);
    expect(users[2].handle).toEqual(USERS[2].handle);

    // Test selecting by condition (with results)
    users = await userTable.selectMany("name", "=", USERS[0].name);
    expect(users.length).toEqual(2);
    expect(users[0].handle).toEqual(USERS[0].handle);
    expect(users[1].handle).toEqual(USERS[2].handle);

    // Test selecting by condition (no results)
    users = await userTable.selectMany("name", "=", "nonexistent");
    expect(users.length).toEqual(0);

    // Test selecting by modifying query
    users = await userTable.selectMany((qb) =>
      qb.where("name", "=", USERS[0].name).orderBy("handle", "desc")
    );
    expect(users.length).toEqual(2);
    expect(users[0].handle).toEqual(USERS[2].handle);
    expect(users[1].handle).toEqual(USERS[0].handle);

    // Test selecting with an expression
    users = await userTable.selectMany(sql`name != ${USERS[0].name}`);
    expect(users.length).toEqual(1);
    expect(users[0].handle).toEqual(USERS[1].handle);
  });

  it("selectOne() selects the required row", async () => {
    for (const user of USERS) {
      await userTable.insertOne(user);
    }

    // Test selecting all
    let user = await userTable.selectOne();
    expect(user?.handle).toEqual(USERS[0].handle);

    // Test selecting by condition (with result)
    user = await userTable.selectOne("name", "=", USERS[0].name);
    expect(user?.handle).toEqual(USERS[0].handle);

    // Test selecting by condition (no result)
    user = await userTable.selectOne("name", "=", "nonexistent");
    expect(user).toBeNull();

    // Test selecting by modifying query
    user = await userTable.selectOne((qb) =>
      qb.where("name", "=", USERS[0].name).orderBy("handle", "desc")
    );
    expect(user?.handle).toEqual(USERS[2].handle);

    // Test selecting with an expression
    user = await userTable.selectOne(sql`name != ${USERS[0].name}`);
    expect(user?.handle).toEqual(USERS[1].handle);
  });
});
