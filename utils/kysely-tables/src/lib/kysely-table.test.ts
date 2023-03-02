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
  it("insertOne() inserts a row without returning columns", async () => {
    const result = await userTable.insertOne(USERS[0]);
    expect(result).toBeUndefined();

    const readUser0 = await userTable
      .selectRows()
      .where("email", "=", USERS[0].email)
      .executeTakeFirst();
    expect(readUser0?.email).toEqual(USERS[0].email);
  });

  it("insertOne() returning an empty object", async () => {
    const updatedUser = await userTable.insertOne(USERS[0], []);
    expect(updatedUser).toEqual({});

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

  it("insertMany() inserts rows without returning columns", async () => {
    const result = await userTable.insertMany(USERS);
    expect(result).toBeUndefined();

    const readUsers = await userTable.selectMany();
    expect(readUsers.length).toEqual(3);
    expect(readUsers[0].handle).toEqual(USERS[0].handle);
    expect(readUsers[1].handle).toEqual(USERS[1].handle);
    expect(readUsers[2].handle).toEqual(USERS[2].handle);
  });

  it("insertMany() returning empty objects", async () => {
    const updatedUsers = await userTable.insertMany(USERS, []);
    expect(updatedUsers).toEqual([{}, {}, {}]);

    const readUsers = await userTable.selectMany();
    expect(readUsers.length).toEqual(3);
    expect(readUsers[0].handle).toEqual(USERS[0].handle);
    expect(readUsers[1].handle).toEqual(USERS[1].handle);
    expect(readUsers[2].handle).toEqual(USERS[2].handle);
  });

  it("insertMany() returning indicated columns", async () => {
    const updatedUsers = await userTable.insertMany(USERS, ["id"]);
    expect(updatedUsers.length).toEqual(3);
    expect(updatedUsers[0].id).toBeGreaterThan(0);
    expect(updatedUsers[1].id).toBeGreaterThan(0);
    expect(updatedUsers[2].id).toBeGreaterThan(0);
    expect(Object.keys(updatedUsers[0]).length).toEqual(1);
    expect(Object.keys(updatedUsers[1]).length).toEqual(1);
    expect(Object.keys(updatedUsers[2]).length).toEqual(1);

    const readUsers = await userTable.selectMany();
    expect(readUsers.length).toEqual(3);
    expect(readUsers[0].id).toEqual(updatedUsers[0].id);
    expect(readUsers[1].id).toEqual(updatedUsers[1].id);
    expect(readUsers[2].id).toEqual(updatedUsers[2].id);

    const post0 = Object.assign({}, POSTS[0], { userId: updatedUsers[0].id });
    const post1 = Object.assign({}, POSTS[1], { userId: updatedUsers[1].id });
    const post2 = Object.assign({}, POSTS[2], { userId: updatedUsers[2].id });
    const updatedPosts = await postTable.insertMany(
      [post0, post1, post2],
      ["id", "createdAt"]
    );
    expect(updatedPosts.length).toEqual(3);
    expect(updatedPosts[0].id).toBeGreaterThan(0);
    expect(updatedPosts[1].id).toBeGreaterThan(0);
    expect(updatedPosts[2].id).toBeGreaterThan(0);
    expect(new Date(updatedPosts[0].createdAt)).not.toBeNaN();
    expect(new Date(updatedPosts[1].createdAt)).not.toBeNaN();
    expect(new Date(updatedPosts[2].createdAt)).not.toBeNaN();
    expect(Object.keys(updatedPosts[0]).length).toEqual(2);
    expect(Object.keys(updatedPosts[1]).length).toEqual(2);
    expect(Object.keys(updatedPosts[2]).length).toEqual(2);
  });

  it("insertMany() returning all columns", async () => {
    const updatedUsers = await userTable.insertMany(USERS, ["*"]);
    expect(updatedUsers.length).toEqual(3);
    expect(updatedUsers[0].id).toBeGreaterThan(0);
    expect(updatedUsers[1].id).toBeGreaterThan(0);
    expect(updatedUsers[2].id).toBeGreaterThan(0);
    expect(updatedUsers[0].handle).toEqual(USERS[0].handle);
    expect(updatedUsers[1].handle).toEqual(USERS[1].handle);
    expect(updatedUsers[2].handle).toEqual(USERS[2].handle);
    expect(updatedUsers[0].name).toEqual(USERS[0].name);
    expect(updatedUsers[1].name).toEqual(USERS[1].name);
    expect(updatedUsers[2].name).toEqual(USERS[2].name);
    expect(updatedUsers[0].email).toEqual(USERS[0].email);
    expect(updatedUsers[1].email).toEqual(USERS[1].email);
    expect(updatedUsers[2].email).toEqual(USERS[2].email);
    expect(Object.keys(updatedUsers[0]).length).toEqual(4);
    expect(Object.keys(updatedUsers[1]).length).toEqual(4);
    expect(Object.keys(updatedUsers[2]).length).toEqual(4);
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
