import { Kysely } from "kysely";

import { StandardFacet } from "..";
import { createDB, resetDB, destroyDB } from "./utils/test-setup";
import { Database } from "./utils/test-tables";
import { PassThruUserFacet, PassThruPostFacet } from "./utils/test-facets";
import { USERS, POSTS } from "./utils/test-objects";
import { ignore } from "@fieldzoo/testing-utils";

let db: Kysely<Database>;
let plainUserFacet: PassThruUserFacet;
let plainPostFacet: PassThruPostFacet;

beforeAll(async () => {
  db = await createDB();
  plainUserFacet = new PassThruUserFacet(db);
  plainPostFacet = new PassThruPostFacet(db);
});
beforeEach(() => resetDB(db));
afterAll(() => destroyDB(db));

describe("insertMany()", () => {
  it("inserts rows without returning columns", async () => {
    const result = await plainUserFacet.insertMany(USERS);
    expect(result).toBeUndefined();

    const readUsers = await plainUserFacet.selectMany({});
    expect(readUsers.length).toEqual(3);
    for (let i = 0; i < USERS.length; i++) {
      expect(readUsers[i].handle).toEqual(USERS[i].handle);
    }
  });

  it("inserts rows returning indicated columns", async () => {
    const updatedUsers = await plainUserFacet.insertMany(USERS, ["id"]);
    expect(updatedUsers.length).toEqual(3);
    for (let i = 0; i < USERS.length; i++) {
      expect(updatedUsers[i].id).toBeGreaterThan(0);
      expect(Object.keys(updatedUsers[i]).length).toEqual(1);
    }

    const readUsers = await plainUserFacet.selectMany({});
    expect(readUsers.length).toEqual(3);
    for (let i = 0; i < USERS.length; i++) {
      expect(readUsers[i].handle).toEqual(USERS[i].handle);
    }

    const post0 = Object.assign({}, POSTS[0], { userId: updatedUsers[0].id });
    const post1 = Object.assign({}, POSTS[1], { userId: updatedUsers[1].id });
    const post2 = Object.assign({}, POSTS[2], { userId: updatedUsers[2].id });
    const updatedPosts = await plainPostFacet.insertMany(
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
    const updatedUsers = await plainUserFacet.insertMany(USERS, ["*"]);
    for (let i = 0; i < USERS.length; i++) {
      expect(updatedUsers[i].id).toBeGreaterThan(0);
    }
    expect(updatedUsers).toEqual(
      USERS.map((user, i) =>
        Object.assign({}, user, { id: updatedUsers[i].id })
      )
    );
  });

  it("errors when insert requests an empty list of returns", async () => {
    expect(plainUserFacet.insertMany(USERS, [])).rejects.toThrow(
      "'returning' cannot be an empty array"
    );

    const readUsers = await plainUserFacet.selectMany({});
    expect(readUsers.length).toEqual(0);
  });

  ignore("detects insertMany() type errors", async () => {
    // @ts-expect-error - returns undefined without returning argument
    plainUserFacet.insertMany([USERS[0]]).email;
    // @ts-expect-error - inserted object must have all required columns
    plainUserFacet.insertMany([{}]);
    // @ts-expect-error - inserted object must have all required columns
    plainUserFacet.insertMany([{ email: "xyz@pdq.xyz" }]);
    // @ts-expect-error - returning argument can't be a string
    plainUserFacet.insertMany([USERS[0]], "id");
    // @ts-expect-error - returning argument can't be a string
    plainUserFacet.insertMany([USERS[0]], "*");
    // @ts-expect-error - returning arguments must be valid column names
    plainUserFacet.insertMany([USERS[0]], [""]);
    // @ts-expect-error - returning arguments must be valid column names
    plainUserFacet.insertMany([USERS[0]], ["notThere"]);
    // @ts-expect-error - returning arguments must be valid column names
    plainUserFacet.insertMany([USERS[0]], ["notThere", "*"]);
    // @ts-expect-error - only requested columns are returned
    (await plainUserFacet.insertMany([USERS[0]], ["id"]))[0].handle;
  });
});

describe("insertOne", () => {
  it("inserts a row without returning columns", async () => {
    const result = await plainUserFacet.insertOne(USERS[0]);
    expect(result).toBeUndefined();

    const readUser0 = await plainUserFacet
      .selectRows()
      .where("email", "=", USERS[0].email)
      .executeTakeFirst();
    expect(readUser0?.email).toEqual(USERS[0].email);
  });

  it("inserts one returning indicated columns", async () => {
    const updatedUser = await plainUserFacet.insertOne(USERS[0], ["id"]);
    expect(updatedUser.id).toBeGreaterThan(0);
    expect(Object.keys(updatedUser).length).toEqual(1);

    const readUser0 = await plainUserFacet
      .selectRows()
      .where("id", "=", updatedUser.id)
      .executeTakeFirst();
    expect(readUser0?.email).toEqual(USERS[0].email);

    const post0 = Object.assign({}, POSTS[0], { userId: updatedUser.id });
    const updatedPost = await plainPostFacet.insertOne(post0, [
      "id",
      "createdAt",
    ]);
    expect(updatedPost.id).toBeGreaterThan(0);
    expect(new Date(updatedPost.createdAt)).not.toBeNaN();
    expect(Object.keys(updatedPost).length).toEqual(2);

    const readPost0 = await plainPostFacet
      .selectRows()
      .where("id", "=", updatedPost.id)
      .where("createdAt", "=", updatedPost.createdAt)
      .executeTakeFirst();
    expect(readPost0?.title).toEqual(post0.title);
  });

  it("inserts one returning all columns", async () => {
    const updatedUser = await plainUserFacet.insertOne(USERS[0], ["*"]);
    expect(updatedUser.id).toBeGreaterThan(0);
    const expectedUser = Object.assign({}, USERS[0], { id: updatedUser.id });
    expect(updatedUser).toEqual(expectedUser);
  });

  it("errors when insert requests an empty list of returns", async () => {
    expect(plainUserFacet.insertOne(USERS[0], [])).rejects.toThrow(
      "'returning' cannot be an empty array"
    );

    const readUsers = await plainUserFacet.selectMany({});
    expect(readUsers.length).toEqual(0);
  });

  ignore("detects insertOne() type errors", async () => {
    // @ts-expect-error - returns undefined without returning argument
    plainUserFacet.insertOne([USERS[0]]).email;
    // @ts-expect-error - inserted object must have all required columns
    plainUserFacet.insertOne({});
    // @ts-expect-error - inserted object must have all required columns
    plainUserFacet.insertOne({ email: "xyz@pdq.xyz" });
    // @ts-expect-error - returning argument can't be a string
    plainUserFacet.insertOne(USERS[0], "id");
    // @ts-expect-error - returning argument can't be a string
    plainUserFacet.insertOne(USERS[0], "*");
    // @ts-expect-error - returning arguments must be valid column names
    plainUserFacet.insertOne(USERS[0], [""]);
    // @ts-expect-error - returning arguments must be valid column names
    plainUserFacet.insertOne(USERS[0], ["notThere"]);
    // @ts-expect-error - returning arguments must be valid column names
    plainUserFacet.insertOne(USERS[0], ["notThere", "*"]);
    // @ts-expect-error - only requested columns are returned
    (await plainUserFacet.insertOne(USERS[0], ["id", "email"])).name;
  });
});

describe("custom insertion returns", () => {
  it("errors when providing an empty defaultInsertReturns array", async () => {
    expect(
      () =>
        new StandardFacet(db, "users", {
          defaultInsertReturns: [],
        })
    ).toThrow("'defaultInsertReturns' cannot be an empty array");
  });
});
