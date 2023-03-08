import { Insertable, Kysely, Selectable } from "kysely";

import { StandardFacet } from "..";
import { createDB, resetDB, destroyDB } from "./utils/test-setup";
import { Database, Users, Posts } from "./utils/test-tables";
import {
  USERS,
  POSTS,
  userRow1,
  userRow2,
  userRow3,
  insertedUser1,
  insertedUser2,
  insertedUser3,
  insertReturnedUser1,
  insertReturnedUser2,
  insertReturnedUser3,
  selectedUser1,
} from "./utils/test-objects";
import { ignore } from "@fieldzoo/testing-utils";
import { InsertedUser, InsertReturnedUser } from "./utils/test-types";

let db: Kysely<Database>;
let plainUserFacet: StandardFacet<
  Database,
  "users",
  Selectable<Users>,
  Insertable<Users>,
  Partial<Insertable<Users>>
>;
let plainUserFacetReturningID: StandardFacet<
  Database,
  "users",
  Selectable<Users>,
  Insertable<Users>,
  Partial<Insertable<Users>>,
  ["id"]
>;
let plainUserFacetReturningAll: StandardFacet<
  Database,
  "users",
  Selectable<Users>,
  Insertable<Users>,
  Partial<Insertable<Users>>,
  ["*"]
>;
let plainPostFacet: StandardFacet<
  Database,
  "posts",
  Selectable<Posts>,
  Insertable<Posts>,
  Partial<Insertable<Posts>>
>;
let plainPostFacetReturningIDAndTitle: StandardFacet<
  Database,
  "posts",
  Selectable<Posts>,
  Insertable<Posts>,
  Partial<Insertable<Posts>>,
  ["id", "title"]
>;

beforeAll(async () => {
  db = await createDB();
  plainUserFacet = new StandardFacet(db, "users");
  plainUserFacetReturningID = new StandardFacet(db, "users", {
    insertReturnColumns: ["id"],
  });
  plainPostFacet = new StandardFacet(db, "posts");
  plainPostFacetReturningIDAndTitle = new StandardFacet(db, "posts", {
    insertReturnColumns: ["id", "title"],
  });
  plainUserFacetReturningAll = new StandardFacet(db, "users", {
    insertReturnColumns: ["*"],
  });
});
beforeEach(() => resetDB(db));
afterAll(() => destroyDB(db));

describe("insertMany() without transformation", () => {
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
    const insertReturns = await plainUserFacetReturningID.insertMany(USERS);
    expect(insertReturns.length).toEqual(3);
    for (let i = 0; i < USERS.length; i++) {
      expect(insertReturns[i].id).toBeGreaterThan(0);
      expect(Object.keys(insertReturns[i]).length).toEqual(1);
    }

    const readUsers = await plainUserFacet.selectMany({});
    expect(readUsers.length).toEqual(3);
    for (let i = 0; i < USERS.length; i++) {
      expect(readUsers[i].handle).toEqual(USERS[i].handle);
    }

    const post0 = Object.assign({}, POSTS[0], { userId: insertReturns[0].id });
    const post1 = Object.assign({}, POSTS[1], { userId: insertReturns[1].id });
    const post2 = Object.assign({}, POSTS[2], { userId: insertReturns[2].id });
    const updatedPosts = await plainPostFacetReturningIDAndTitle.insertMany([
      post0,
      post1,
      post2,
    ]);
    expect(updatedPosts.length).toEqual(3);
    for (let i = 0; i < updatedPosts.length; i++) {
      expect(updatedPosts[i].id).toBeGreaterThan(0);
      expect(updatedPosts[i].title).toEqual(POSTS[i].title);
      expect(Object.keys(updatedPosts[i]).length).toEqual(2);
    }
  });

  it("inserts rows returning all columns", async () => {
    const insertReturns = await plainUserFacetReturningAll.insertMany(USERS);
    for (let i = 0; i < USERS.length; i++) {
      expect(insertReturns[i].id).toBeGreaterThan(0);
    }
    expect(insertReturns).toEqual(
      USERS.map((user, i) =>
        Object.assign({}, user, { id: insertReturns[i].id })
      )
    );
  });

  ignore("detects insertMany() type errors", async () => {
    // @ts-expect-error - inserted object must have all required columns
    plainUserFacet.insertMany([{}]);
    // @ts-expect-error - inserted object must have all required columns
    plainUserFacet.insertMany([{ email: "xyz@pdq.xyz" }]);
    // @ts-expect-error - only configured columns are returned
    (await plainUserFacetReturningID.insertMany([USERS[0]]))[0].handle;
  });
});

describe("insertOne() without transformation", () => {
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
    const insertReturn = await plainUserFacet.insertOne(USERS[0], ["id"]);
    expect(insertReturn.id).toBeGreaterThan(0);
    expect(Object.keys(insertReturn).length).toEqual(1);

    const readUser0 = await plainUserFacet
      .selectRows()
      .where("id", "=", insertReturn.id)
      .executeTakeFirst();
    expect(readUser0?.email).toEqual(USERS[0].email);

    const post0 = Object.assign({}, POSTS[0], { userId: insertReturn.id });
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
    const insertReturn = await plainUserFacet.insertOne(USERS[0], ["*"]);
    expect(insertReturn.id).toBeGreaterThan(0);
    const expectedUser = Object.assign({}, USERS[0], { id: insertReturn.id });
    expect(insertReturn).toEqual(expectedUser);
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

describe("insertion transformation", () => {
  class InsertTransformFacet extends StandardFacet<
    Database,
    "users",
    Selectable<Database["users"]>,
    InsertedUser
  > {
    constructor(db: Kysely<Database>) {
      super(db, "users", {
        insertTransform: (source) => ({
          name: `${source.firstName} ${source.lastName}`,
          handle: source.handle,
          email: source.email,
        }),
      });
    }
  }

  it("transforms users for insertion without transforming return", async () => {
    const insertTransformFacet = new InsertTransformFacet(db);

    const insertReturn = await insertTransformFacet.insertOne(insertedUser1, [
      "id",
    ]);
    const readUser1 = await insertTransformFacet.selectOne({
      id: insertReturn.id,
    });
    expect(readUser1?.name).toEqual(
      `${insertedUser1.firstName} ${insertedUser1.lastName}`
    );

    await insertTransformFacet.insertMany([insertedUser2, insertedUser3]);
    const readUsers = await insertTransformFacet.selectMany([
      "id",
      ">",
      insertReturn.id,
    ]);
    expect(readUsers.length).toEqual(2);
    expect(readUsers[0].name).toEqual(
      `${insertedUser2.firstName} ${insertedUser2.lastName}`
    );
    expect(readUsers[1].name).toEqual(
      `${insertedUser3.firstName} ${insertedUser3.lastName}`
    );
  });

  it("transforms insertion return without transforming insertion", async () => {
    class InsertReturnTransformFacet extends StandardFacet<
      Database,
      "users",
      Selectable<Database["users"]>,
      Insertable<Database["users"]>,
      Partial<Insertable<Database["users"]>>,
      ["id"],
      InsertReturnedUser
    > {
      constructor(db: Kysely<Database>) {
        super(db, "users", {
          insertReturnColumns: ["id"],
          insertReturnTransform: (source, returns) =>
            new InsertReturnedUser(
              returns.id!,
              source.name.split(" ")[0],
              source.name.split(" ")[1],
              source.handle,
              source.email
            ),
        });
      }
    }
    const insertReturnTransformFacet = new InsertReturnTransformFacet(db);

    const insertReturn = await insertReturnTransformFacet.insertOne(userRow1);
    expect(insertReturn).toEqual(insertReturnedUser1);

    const insertReturns = await insertReturnTransformFacet.insertMany([
      userRow2,
      userRow3,
    ]);
    expect(insertReturns).toEqual([insertReturnedUser2, insertReturnedUser3]);
  });

  it("transforms insertion and insertion return", async () => {
    class InsertAndReturnTransformFacet extends StandardFacet<
      Database,
      "users",
      Selectable<Database["users"]>,
      InsertedUser,
      Partial<Insertable<Database["users"]>>,
      ["id"],
      InsertReturnedUser
    > {
      constructor(db: Kysely<Database>) {
        super(db, "users", {
          insertTransform: (source) => ({
            name: `${source.firstName} ${source.lastName}`,
            handle: source.handle,
            email: source.email,
          }),
          insertReturnColumns: ["id"],
          insertReturnTransform: (source, returns) =>
            new InsertReturnedUser(
              returns.id!,
              source.firstName,
              source.lastName,
              source.handle,
              source.email
            ),
        });
      }
    }
    const insertAndReturnTransformFacet = new InsertAndReturnTransformFacet(db);

    const insertReturn = await insertAndReturnTransformFacet.insertOne(
      insertedUser1
    );
    expect(insertReturn).toEqual(insertReturnedUser1);

    const insertReturns = await insertAndReturnTransformFacet.insertMany([
      insertedUser2,
      insertedUser3,
    ]);
    expect(insertReturns).toEqual([insertReturnedUser2, insertReturnedUser3]);
  });

  it("errors when providing an empty insertReturnColumns array", () => {
    expect(
      () =>
        new StandardFacet(db, "users", {
          insertReturnTransform: (source, _returns) => source,
          insertReturnColumns: [],
        })
    ).toThrow("No 'insertReturnColumns' returned for 'insertReturnTransform'");
  });

  it("errors when providing insertReturnTransform but not insertReturnColumns", () => {
    expect(
      () =>
        new StandardFacet(db, "users", {
          insertReturnTransform: (source, _returns) => source,
        })
    ).toThrow("'insertReturnTransform' requires 'insertReturnColumns'");
  });

  ignore("detects insertion transformation type errors", async () => {
    const insertTransformFacet = new InsertTransformFacet(db);

    // @ts-expect-error - requires InsertedType as input
    await insertTransformFacet.insertOne(USERS[0]);
    // @ts-expect-error - requires InsertedType as input
    await insertTransformFacet.insertOne(selectedUser1);
  });
});
