import { Kysely, sql } from "kysely";

import { createDB, resetDB, destroyDB } from "../test-utils/test-setup";
import { Database, UserTable, PostTable } from "../test-utils/test-tables";
import { USERS, POSTS } from "../test-utils/test-objects";
import { ignore } from "@fieldzoo/testing-utils";

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
    const expectedUser = Object.assign({}, USERS[0], { id: updatedUser.id });
    expect(updatedUser).toEqual(expectedUser);
  });

  // NOTE: The following test isn't functioning because SQLite is throwing the
  // error `SqliteError { code: 'SQLITE_ERROR' }` and Jest isn't catching it.
  //
  // it("insertOne() failing to returning requested columns", async () => {
  //   expect(() => userTable.insertOne(USERS[0], ["notThere"] as any)).toThrow(
  //     NoResultError
  //   );
  //   const readUser0 = await userTable
  //     .selectRows()
  //     .where("email", "=", USERS[0].email)
  //     .executeTakeFirst();
  //   expect(readUser0?.email).toEqual(USERS[0].email);

  //   expect(() => userTable.insertOne(USERS[1], ["x", "y"] as any)).toThrow(
  //     NoResultError
  //   );
  //   const readUser1 = await userTable
  //     .selectRows()
  //     .where("email", "=", USERS[1].email)
  //     .executeTakeFirst();
  //   expect(readUser1?.email).toEqual(USERS[1].email);
  // });

  ignore("insertOne() type errors", () => {
    // @ts-expect-error - inserted object must have all required columns
    userTable.insertOne({});
    // @ts-expect-error - inserted object must have all required columns
    userTable.insertOne({ email: "xyz@pdq.xyz" });
    // @ts-expect-error - returning argument can't be a string
    userTable.insertOne(USERS[0], "id");
    // @ts-expect-error - returning argument can't be a string
    userTable.insertOne(USERS[0], "*");
    // @ts-expect-error - returning arguments must be valid column names
    userTable.insertOne(USERS[0], [""]);
    // @ts-expect-error - returning arguments must be valid column names
    userTable.insertOne(USERS[0], ["notThere"]);
    // @ts-expect-error - returning arguments must be valid column names
    userTable.insertOne(USERS[0], ["notThere", "*"]);
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
    expect(updatedUsers).toEqual([
      Object.assign({}, USERS[0], { id: updatedUsers[0].id }),
      Object.assign({}, USERS[1], { id: updatedUsers[1].id }),
      Object.assign({}, USERS[2], { id: updatedUsers[2].id }),
    ]);
    expect(updatedUsers[0].id).toBeGreaterThan(0);
    expect(updatedUsers[1].id).toBeGreaterThan(0);
    expect(updatedUsers[2].id).toBeGreaterThan(0);
  });

  ignore("insertMany() type errors", () => {
    // @ts-expect-error - inserted object must have all required columns
    userTable.insertMany([{}]);
    // @ts-expect-error - inserted object must have all required columns
    userTable.insertMany([{ email: "xyz@pdq.xyz" }]);
    // @ts-expect-error - returning argument can't be a string
    userTable.insertMany([USERS[0]], "id");
    // @ts-expect-error - returning argument can't be a string
    userTable.insertMany([USERS[0]], "*");
    // @ts-expect-error - returning arguments must be valid column names
    userTable.insertMany([USERS[0]], [""]);
    // @ts-expect-error - returning arguments must be valid column names
    userTable.insertMany([USERS[0]], ["notThere"]);
    // @ts-expect-error - returning arguments must be valid column names
    userTable.insertMany([USERS[0]], ["notThere", "*"]);
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

  ignore("selectMany() type errors", () => {
    // @ts-expect-error - doesn't allow plain string expressions
    userTable.selectMany("name = 'John Doe'");
    // @ts-expect-error - doesn't allow only two arguments
    userTable.selectMany("name", "=");
  });

  it("selectOne() selects the required row", async () => {
    for (const user of USERS) {
      await userTable.insertOne(user);
    }

    // Test selecting all
    let user = await userTable.selectOne();
    expect(user?.handle).toEqual(USERS[0].handle);

    // Test selecting by condition (with result)
    user = await userTable.selectOne(["name", "=", USERS[0].name]);
    expect(user?.handle).toEqual(USERS[0].handle);

    // Test selecting by condition (no result)
    user = await userTable.selectOne(["name", "=", "nonexistent"]);
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

  ignore("selectOne() type errors", () => {
    // @ts-expect-error - doesn't allow plain string expressions
    userTable.selectOne("name = 'John Doe'");
    // @ts-expect-error - doesn't allow only two arguments
    userTable.selectOne("name", "=");
  });
});

describe("update", () => {
  it("updateByMatch() updates without returning columns", async () => {
    const insertedUser0 = await userTable.insertOne(USERS[0], ["id"]);
    await userTable.insertOne(USERS[1]);
    await userTable.insertOne(USERS[2]);

    const updateValues = { email: "new.email@xyz.pdq" };
    const updateCount1 = await userTable.updateByMatch(
      { id: insertedUser0.id },
      updateValues
    );
    expect(updateCount1).toEqual(1);

    const readUser = await userTable.selectOne(["id", "=", insertedUser0.id]);
    expect(readUser?.email).toEqual(updateValues.email);

    const updateCount2 = await userTable.updateByMatch(
      { name: "Sue" },
      updateValues
    );
    expect(updateCount2).toEqual(2);

    const readUsers = await userTable.selectMany("name", "=", "Sue");
    expect(readUsers.length).toEqual(2);
    expect(readUsers[0].email).toEqual(updateValues.email);
    expect(readUsers[1].email).toEqual(updateValues.email);
  });

  it("updateByMatch() updates returning an empty array", async () => {
    const insertedUser = await userTable.insertOne(USERS[0], ["id"]);
    const updateValues = { email: "new.email@xyz.pdq" };

    const updatedUsers = await userTable.updateByMatch(
      { id: insertedUser.id },
      updateValues,
      []
    );
    expect(updatedUsers).toEqual([]);
    const readUser = await userTable.selectOne(["id", "=", insertedUser.id]);
    expect(readUser?.email).toEqual(updateValues.email);
  });

  it("updateByMatch() updates returning indicated columns", async () => {
    await userTable.insertOne(USERS[0]);
    const insertedUser = await userTable.insertOne(USERS[1], ["id"]);
    await userTable.insertOne(USERS[2]);

    // Verify that update performs the correct change on the correct row.
    const updateValues1 = { email: "new.email@xyz.pdq" };
    const updatedUsers1 = await userTable.updateByMatch(
      { id: insertedUser.id },
      updateValues1,
      ["name"]
    );
    expect(updatedUsers1).toEqual([{ name: USERS[1].name }]);
    let readUser = await userTable.selectOne(["id", "=", insertedUser.id]);
    expect(readUser?.email).toEqual(updateValues1.email);

    // Verify a different change on the same row, returning multiple columns.
    const updateValues2 = { name: "Sue" };
    const updatedUsers2 = await userTable.updateByMatch(
      { email: updateValues1.email },
      updateValues2,
      ["id", "handle"]
    );
    expect(updatedUsers2).toEqual([
      {
        id: insertedUser.id,
        handle: USERS[1].handle,
      },
    ]);
    readUser = await userTable.selectOne(["id", "=", insertedUser.id]);
    expect(readUser?.name).toEqual(updateValues2.name);

    // Verify that update changes all required rows.
    const updateValues3 = { name: "Replacement Sue" };
    const updatedUsers3 = await userTable.updateByMatch(
      { name: "Sue" },
      updateValues3,
      ["handle"]
    );
    expect(updatedUsers3).toEqual([
      { handle: USERS[0].handle },
      { handle: USERS[1].handle },
      { handle: USERS[2].handle },
    ]);
    const readUsers = await userTable.selectMany(
      "name",
      "=",
      updateValues3.name
    );
    expect(readUsers.length).toEqual(3);
  });

  it("updateByMatch() updates returning all columns", async () => {
    const insertedUsers = await userTable.insertMany(USERS, ["id"]);

    const updateValues = { email: "new.email@xyz.pdq" };
    const updatedUsers = await userTable.updateByMatch(
      { name: "Sue" },
      updateValues,
      ["*"]
    );

    const expectedUsers = [
      Object.assign({}, USERS[0], updateValues, { id: insertedUsers[0].id }),
      Object.assign({}, USERS[2], updateValues, { id: insertedUsers[2].id }),
    ];
    expect(updatedUsers).toEqual(expectedUsers);

    const readUsers = await userTable.selectMany("name", "=", "Sue");
    expect(readUsers).toEqual(expectedUsers);
  });

  ignore("updateByMatch() type errors", () => {
    // @ts-expect-error - table must have all keys
    userTable.updateByMatch({ notThere: "xyz" }, { email: "abc@def.ghi" });
    // @ts-expect-error - update must only have table columns
    userTable.updateByMatch({ id: 32 }, { notThere: "xyz@pdq.xyz" });
    // @ts-expect-error - returning argument can't be a string
    userTable.updateByMatch({ id: 32 }, USERS[0], "id");
    // @ts-expect-error - returning argument can't be a string
    userTable.updateByMatch({ id: 32 }, USERS[0], "*");
    // @ts-expect-error - returning arguments must be valid column names
    userTable.updateByMatch({ id: 32 }, USERS[0], [""]);
    // @ts-expect-error - returning arguments must be valid column names
    userTable.updateByMatch({ id: 32 }, USERS[0], ["notThere"]);
    // @ts-expect-error - returning arguments must be valid column names
    userTable.updateByMatch({ id: 32 }, USERS[0], ["notThere", "*"]);
  });
});
