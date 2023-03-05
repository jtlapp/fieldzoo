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

describe("insertMany()", () => {
  it("inserts rows without returning columns", async () => {
    const result = await userTable.insertMany(USERS);
    expect(result).toBeUndefined();

    const readUsers = await userTable.selectMany({});
    expect(readUsers.length).toEqual(3);
    for (let i = 0; i < USERS.length; i++) {
      expect(readUsers[i].handle).toEqual(USERS[i].handle);
    }
  });

  it("inserts rows returning empty objects for an empty return list", async () => {
    const updatedUsers = await userTable.insertMany(USERS, []);
    expect(updatedUsers).toEqual(USERS.map(() => ({})));

    const readUsers = await userTable.selectMany({});
    expect(readUsers.length).toEqual(3);
    for (let i = 0; i < USERS.length; i++) {
      expect(readUsers[i].handle).toEqual(USERS[i].handle);
    }
  });

  it("inserts rows returning indicated columns", async () => {
    const updatedUsers = await userTable.insertMany(USERS, ["id"]);
    expect(updatedUsers.length).toEqual(3);
    for (let i = 0; i < USERS.length; i++) {
      expect(updatedUsers[i].id).toBeGreaterThan(0);
      expect(Object.keys(updatedUsers[i]).length).toEqual(1);
    }

    const readUsers = await userTable.selectMany({});
    expect(readUsers.length).toEqual(3);
    for (let i = 0; i < USERS.length; i++) {
      expect(readUsers[i].handle).toEqual(USERS[i].handle);
    }

    const post0 = Object.assign({}, POSTS[0], { userId: updatedUsers[0].id });
    const post1 = Object.assign({}, POSTS[1], { userId: updatedUsers[1].id });
    const post2 = Object.assign({}, POSTS[2], { userId: updatedUsers[2].id });
    const updatedPosts = await postTable.insertMany(
      [post0, post1, post2],
      ["id", "createdAt"]
    );
    expect(updatedPosts.length).toEqual(3);
    for (let i = 0; i < updatedPosts.length; i++) {
      expect(updatedPosts[i].id).toBeGreaterThan(0);
      expect(new Date(updatedPosts[i].createdAt)).not.toBeNaN();
      expect(Object.keys(updatedPosts[i]).length).toEqual(2);
    }
  });

  it("inserts rows returning all columns", async () => {
    const updatedUsers = await userTable.insertMany(USERS, ["*"]);
    for (let i = 0; i < USERS.length; i++) {
      expect(updatedUsers[i].id).toBeGreaterThan(0);
    }
    expect(updatedUsers).toEqual(
      USERS.map((user, i) =>
        Object.assign({}, user, { id: updatedUsers[i].id })
      )
    );
  });

  ignore("reports insertMany() type errors", async () => {
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
    // @ts-expect-error - only requested columns are returned
    (await userTable.insertMany([USERS[0]], ["id"]))[0].handle;
  });
});

describe("insertOne", () => {
  it("inserts a row without returning columns", async () => {
    const result = await userTable.insertOne(USERS[0]);
    expect(result).toBeUndefined();

    const readUser0 = await userTable
      .selectRows()
      .where("email", "=", USERS[0].email)
      .executeTakeFirst();
    expect(readUser0?.email).toEqual(USERS[0].email);
  });

  it("inserts one returnomg an empty object for an empty return list", async () => {
    const updatedUser = await userTable.insertOne(USERS[0], []);
    expect(updatedUser).toEqual({});

    const readUser0 = await userTable
      .selectRows()
      .where("email", "=", USERS[0].email)
      .executeTakeFirst();
    expect(readUser0?.email).toEqual(USERS[0].email);
  });

  it("inserts one returning indicated columns", async () => {
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

  it("inserts one returning all columns", async () => {
    const updatedUser = await userTable.insertOne(USERS[0], ["*"]);
    expect(updatedUser.id).toBeGreaterThan(0);
    const expectedUser = Object.assign({}, USERS[0], { id: updatedUser.id });
    expect(updatedUser).toEqual(expectedUser);
  });

  ignore("reports insertOne() type errors", async () => {
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
    // @ts-expect-error - only requested columns are returned
    (await userTable.insertOne(USERS[0], ["id", "email"])).name;
  });
});

describe("selectMany()", () => {
  it("selects the required rows", async () => {
    for (const user of USERS) {
      await userTable.insertOne(user);
    }

    // Test selecting all
    let users = await userTable.selectMany({});
    expect(users.length).toEqual(3);
    for (let i = 0; i < 3; i++) {
      expect(users[i].handle).toEqual(USERS[i].handle);
    }

    // Test selecting by matching object
    users = await userTable.selectMany({ name: USERS[0].name });
    expect(users.length).toEqual(2);
    expect(users[0].handle).toEqual(USERS[0].handle);
    expect(users[1].handle).toEqual(USERS[2].handle);
    users = await userTable.selectMany({
      name: USERS[0].name,
      handle: USERS[2].handle,
    });
    expect(users.length).toEqual(1);
    expect(users[0].handle).toEqual(USERS[2].handle);

    // Test selecting by condition (with results)
    users = await userTable.selectMany(["name", "=", USERS[0].name]);
    expect(users.length).toEqual(2);
    expect(users[0].handle).toEqual(USERS[0].handle);
    expect(users[1].handle).toEqual(USERS[2].handle);

    // Test selecting by condition (no results)
    users = await userTable.selectMany(["name", "=", "nonexistent"]);
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

  ignore("reports selectMany() type errors", async () => {
    // @ts-expect-error - doesn't allow plain string expressions
    userTable.selectMany("name = 'John Doe'");
    // @ts-expect-error - doesn't allow only two arguments
    userTable.selectMany("name", "=");
    // @ts-expect-error - object filter fields must be valid
    userTable.selectMany({ notThere: "xyz" });
    // @ts-expect-error - binary op filter fields must be valid
    userTable.selectMany(["notThere", "=", "foo"]);
    // @ts-expect-error - only table columns are accessible unfiltered
    (await userTable.selectMany({}))[0].notThere;
    // @ts-expect-error - only table columns are accessible w/ object filter
    (await userTable.selectMany({ name: "Sue" }))[0].notThere;
    // @ts-expect-error - only table columns are accessible w/ op filter
    (await userTable.selectMany(["name", "=", "Sue"]))[0].notThere;
    // @ts-expect-error - only table columns are accessible w/ QB filter
    (await userTable.selectMany((qb) => qb))[0].notThere;
    // @ts-expect-error - only table columns are accessible w/ expr filter
    (await userTable.selectMany(sql`name = 'Sue'`))[0].notThere;
  });
});

describe("selectOne()", () => {
  it("selects the required row", async () => {
    for (const user of USERS) {
      await userTable.insertOne(user);
    }

    // Test selecting all
    let user = await userTable.selectOne({});
    expect(user?.handle).toEqual(USERS[0].handle);

    // Test selecting by matching object
    user = await userTable.selectOne({ name: USERS[0].name });
    expect(user?.handle).toEqual(USERS[0].handle);
    user = await userTable.selectOne({
      name: USERS[0].name,
      handle: USERS[2].handle,
    });
    expect(user?.handle).toEqual(USERS[2].handle);

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

  ignore("reports selectOne() type errors", async () => {
    // @ts-expect-error - doesn't allow plain string expression filters
    userTable.selectOne("name = 'John Doe'");
    // @ts-expect-error - doesn't allow only two arguments of a binary op
    userTable.selectOne(["name", "="]);
    // @ts-expect-error - object filter fields must be valid
    userTable.selectOne({ notThere: "xyz" });
    // @ts-expect-error - binary op filter fields must be valid
    userTable.selectOne(["notThere", "=", "foo"]);
    // @ts-expect-error - only table columns are accessible unfiltered
    (await userTable.selectOne({})).notThere;
    // @ts-expect-error - only table columns are accessible w/ object filter
    (await userTable.selectOne({ name: "Sue" })).notThere;
    // @ts-expect-error - only table columns are accessible w/ op filter
    (await userTable.selectOne(["name", "=", "Sue"])).notThere;
    // @ts-expect-error - only table columns are accessible w/ QB filter
    (await userTable.selectOne((qb) => qb)).notThere;
    // @ts-expect-error - only table columns are accessible w/ expr filter
    (await userTable.selectOne(sql`name = 'Sue'`)).notThere;
  });
});

describe("update()", () => {
  it("updates without returning columns", async () => {
    const insertedUser0 = await userTable.insertOne(USERS[0], ["id"]);
    await userTable.insertOne(USERS[1]);
    await userTable.insertOne(USERS[2]);

    const updateValues = { email: "new.email@xyz.pdq" };
    const updateCount1 = await userTable.update(
      { id: insertedUser0.id },
      updateValues
    );
    expect(updateCount1).toEqual(1);

    const readUser = await userTable.selectOne(["id", "=", insertedUser0.id]);
    expect(readUser?.email).toEqual(updateValues.email);

    const updateCount2 = await userTable.update({ name: "Sue" }, updateValues);
    expect(updateCount2).toEqual(2);

    const readUsers = await userTable.selectMany(["name", "=", "Sue"]);
    expect(readUsers.length).toEqual(2);
    expect(readUsers[0].email).toEqual(updateValues.email);
    expect(readUsers[1].email).toEqual(updateValues.email);
  });

  it("updates returning an empty array", async () => {
    const insertedUser = await userTable.insertOne(USERS[0], ["id"]);
    const updateValues = { email: "new.email@xyz.pdq" };

    const updatedUsers = await userTable.update(
      { id: insertedUser.id },
      updateValues,
      []
    );
    expect(updatedUsers).toEqual([]);
    const readUser = await userTable.selectOne(["id", "=", insertedUser.id]);
    expect(readUser?.email).toEqual(updateValues.email);
  });

  it("updates returning indicated columns", async () => {
    await userTable.insertOne(USERS[0]);
    const insertedUser = await userTable.insertOne(USERS[1], ["id"]);
    await userTable.insertOne(USERS[2]);

    // Verify that update performs the correct change on the correct row.
    const updateValues1 = { email: "new.email@xyz.pdq" };
    const updatedUsers1 = await userTable.update(
      { id: insertedUser.id },
      updateValues1,
      ["name"]
    );
    expect(updatedUsers1).toEqual([{ name: USERS[1].name }]);
    let readUser = await userTable.selectOne(["id", "=", insertedUser.id]);
    expect(readUser?.email).toEqual(updateValues1.email);

    // Verify a different change on the same row, returning multiple columns.
    const updateValues2 = { name: "Sue" };
    const updatedUsers2 = await userTable.update(
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
    const updatedUsers3 = await userTable.update(
      { name: "Sue" },
      updateValues3,
      ["handle"]
    );
    expect(updatedUsers3).toEqual([
      { handle: USERS[0].handle },
      { handle: USERS[1].handle },
      { handle: USERS[2].handle },
    ]);
    const readUsers = await userTable.selectMany([
      "name",
      "=",
      updateValues3.name,
    ]);
    expect(readUsers.length).toEqual(3);
  });

  it("updates returning all columns", async () => {
    const insertedUsers = await userTable.insertMany(USERS, ["id"]);

    const updateValues = { email: "new.email@xyz.pdq" };
    const updatedUsers = await userTable.update({ name: "Sue" }, updateValues, [
      "*",
    ]);

    const expectedUsers = [
      Object.assign({}, USERS[0], updateValues, { id: insertedUsers[0].id }),
      Object.assign({}, USERS[2], updateValues, { id: insertedUsers[2].id }),
    ];
    expect(updatedUsers).toEqual(expectedUsers);

    const readUsers = await userTable.selectMany(["name", "=", "Sue"]);
    expect(readUsers).toEqual(expectedUsers);
  });

  it("updates all rows when no filter is given", async () => {
    await userTable.insertMany(USERS, ["id"]);

    const updateValues = { email: "new.email@xyz.pdq" };
    const updatedUsers = await userTable.update({}, updateValues, ["handle"]);

    const expectedUsers = USERS.map((user) => {
      return { handle: user.handle };
    });
    expect(updatedUsers).toEqual(expectedUsers);

    const readUsers = await userTable.selectMany({});
    expect(readUsers.length).toEqual(3);
    for (const user of readUsers) {
      expect(user.email).toEqual(updateValues.email);
    }
  });

  it("updates rows indicated by a binary operator", async () => {
    const insertedUsers = await userTable.insertMany(USERS, ["id"]);

    const updateValues = { email: "new.email@xyz.pdq" };
    const updateCount = await userTable.update(
      ["id", ">", insertedUsers[0].id],
      updateValues
    );
    expect(updateCount).toEqual(2);

    const readUsers = await userTable.selectMany([
      "id",
      ">",
      insertedUsers[0].id,
    ]);
    expect(readUsers.length).toEqual(2);
    for (const user of readUsers) {
      expect(user.email).toEqual(updateValues.email);
    }
  });

  it("updates rows indicated by a kysely expression", async () => {
    const insertedUsers = await userTable.insertMany(USERS, ["id"]);

    const updateValues = { email: "new.email.@xyz.pdq" };
    const updateCount = await userTable.update(
      sql`id > ${insertedUsers[0].id}`,
      updateValues
    );
    expect(updateCount).toEqual(2);

    const readUsers = await userTable.selectMany([
      "id",
      ">",
      insertedUsers[0].id,
    ]);
    expect(readUsers.length).toEqual(2);
    for (const user of readUsers) {
      expect(user.email).toEqual(updateValues.email);
    }
  });

  ignore("reports type errors", () => {
    // @ts-expect-error - table must have all filter fields
    userTable.update({ notThere: "xyz" }, { email: "abc@def.ghi" });
    // @ts-expect-error - table must have all filter fields
    userTable.update(["notThere", "=", "foo"], { email: "abc@def.ghi" });
    // @ts-expect-error - update must only have table columns
    userTable.update({ id: 32 }, { notThere: "xyz@pdq.xyz" });
    // @ts-expect-error - returning argument can't be a string
    userTable.update({ id: 32 }, USERS[0], "id");
    // @ts-expect-error - returning argument can't be a string
    userTable.update({ id: 32 }, USERS[0], "*");
    // @ts-expect-error - returning arguments must be valid column names
    userTable.update({ id: 32 }, USERS[0], [""]);
    // @ts-expect-error - returning arguments must be valid column names
    userTable.update({ id: 32 }, USERS[0], ["notThere"]);
    // @ts-expect-error - returning arguments must be valid column names
    userTable.update({ id: 32 }, USERS[0], ["notThere", "*"]);
    // @ts-expect-error - doesn't allow plain string expression filters
    userTable.update("name = 'John Doe'", USERS[0]);
    // @ts-expect-error - only requested columns are accessible
    (await userTable.update({ id: 32 }, USERS[0], ["id"]))[0].name;
  });
});
