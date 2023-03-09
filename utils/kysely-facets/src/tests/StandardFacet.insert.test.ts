import { Insertable, Kysely, Selectable } from "kysely";

import { StandardFacet } from "..";
import { createDB, resetDB, destroyDB } from "./utils/test-setup";
import { Database, Posts } from "./utils/test-tables";
import {
  StdUserFacet,
  StdUserFacetReturningID,
  StdUserFacetReturningAll,
} from "./utils/test-facets";
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
import { InsertedUser, ReturnedUser } from "./utils/test-types";

let db: Kysely<Database>;

let stdUserFacet: StdUserFacet;
let stdUserFacetReturningID: StdUserFacetReturningID;
let stdUserFacetReturningAll: StdUserFacetReturningAll;

let stdPostFacet: StandardFacet<
  Database,
  "posts",
  Selectable<Posts>,
  Insertable<Posts>,
  Partial<Insertable<Posts>>
>;
let stdPostFacetReturningIDAndTitle: StandardFacet<
  Database,
  "posts",
  Selectable<Posts>,
  Insertable<Posts>,
  Partial<Insertable<Posts>>,
  ["id", "title"]
>;

beforeAll(async () => {
  db = await createDB();
  stdUserFacet = new StdUserFacet(db);
  stdUserFacetReturningID = new StdUserFacetReturningID(db);
  stdUserFacetReturningAll = new StdUserFacetReturningAll(db);
  stdPostFacet = new StandardFacet(db, "posts");
  stdPostFacetReturningIDAndTitle = new StandardFacet(db, "posts", {
    returnColumns: ["id", "title"],
  });
});
beforeEach(() => resetDB(db));
afterAll(() => destroyDB(db));

describe("insertMany() without transformation", () => {
  it("inserts rows without returning columns", async () => {
    const result = await stdUserFacet.insertMany(USERS);
    expect(result).toBeUndefined();

    const readUsers = await stdUserFacet.selectMany({});
    expect(readUsers.length).toEqual(3);
    for (let i = 0; i < USERS.length; i++) {
      expect(readUsers[i].handle).toEqual(USERS[i].handle);
    }
  });

  it("inserts rows returning configured return columns", async () => {
    const insertReturns = await stdUserFacetReturningID.insertMany(USERS);
    expect(insertReturns.length).toEqual(3);
    for (let i = 0; i < USERS.length; i++) {
      expect(insertReturns[i].id).toBeGreaterThan(0);
      expect(Object.keys(insertReturns[i]).length).toEqual(1);
    }

    const readUsers = await stdUserFacet.selectMany({});
    expect(readUsers.length).toEqual(3);
    for (let i = 0; i < USERS.length; i++) {
      expect(readUsers[i].handle).toEqual(USERS[i].handle);
    }

    const post0 = Object.assign({}, POSTS[0], { userId: insertReturns[0].id });
    const post1 = Object.assign({}, POSTS[1], { userId: insertReturns[1].id });
    const post2 = Object.assign({}, POSTS[2], { userId: insertReturns[2].id });
    const updaterPosts = await stdPostFacetReturningIDAndTitle.insertMany([
      post0,
      post1,
      post2,
    ]);
    expect(updaterPosts.length).toEqual(3);
    for (let i = 0; i < updaterPosts.length; i++) {
      expect(updaterPosts[i].id).toBeGreaterThan(0);
      expect(updaterPosts[i].title).toEqual(POSTS[i].title);
      expect(Object.keys(updaterPosts[i]).length).toEqual(2);
    }
  });

  it("inserts rows configured to return all columns", async () => {
    const insertReturns = await stdUserFacetReturningAll.insertMany(USERS);
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
    stdUserFacet.insertMany([{}]);
    // @ts-expect-error - inserted object must have all required columns
    stdUserFacet.insertMany([{ email: "xyz@pdq.xyz" }]);
    // @ts-expect-error - only configured columns are returned
    (await stdUserFacetReturningID.insertMany([USERS[0]]))[0].handle;
  });
});

describe("insertOne() without transformation", () => {
  it("inserts a row without returning columns", async () => {
    const result = await stdUserFacet.insertOne(USERS[0]);
    expect(result).toBeUndefined();

    const readUser0 = await stdUserFacet
      .selectRows()
      .where("email", "=", USERS[0].email)
      .executeTakeFirst();
    expect(readUser0?.email).toEqual(USERS[0].email);
  });

  it("inserts one returning configured return columns", async () => {
    const insertReturn = await stdUserFacetReturningID.insertOne(USERS[0]);
    expect(insertReturn.id).toBeGreaterThan(0);
    expect(Object.keys(insertReturn).length).toEqual(1);

    const readUser0 = await stdUserFacet
      .selectRows()
      .where("id", "=", insertReturn.id)
      .executeTakeFirst();
    expect(readUser0?.email).toEqual(USERS[0].email);

    const post0 = Object.assign({}, POSTS[0], { userId: insertReturn.id });
    const updaterPost = await stdPostFacetReturningIDAndTitle.insertOne(post0);
    expect(updaterPost.id).toBeGreaterThan(0);
    expect(updaterPost.title).toEqual(POSTS[0].title);
    expect(Object.keys(updaterPost).length).toEqual(2);

    const readPost0 = await stdPostFacet
      .selectRows()
      .where("id", "=", updaterPost.id)
      .where("title", "=", updaterPost.title)
      .executeTakeFirst();
    expect(readPost0?.likeCount).toEqual(post0.likeCount);
  });

  it("inserts one configured to return all columns", async () => {
    const insertReturn = await stdUserFacetReturningAll.insertOne(USERS[0]);
    expect(insertReturn.id).toBeGreaterThan(0);
    const expectedUser = Object.assign({}, USERS[0], { id: insertReturn.id });
    expect(insertReturn).toEqual(expectedUser);
  });

  ignore("detects insertOne() type errors", async () => {
    // @ts-expect-error - inserted object must have all required columns
    stdUserFacet.insertOne({});
    // @ts-expect-error - inserted object must have all required columns
    stdUserFacet.insertOne({ email: "xyz@pdq.xyz" });
    // @ts-expect-error - only requested columns are returned
    (await stdUserFacet.insertOne(USERS[0])).name;
  });
});

describe("insertion transformation", () => {
  class InsertTransformFacet extends StandardFacet<
    Database,
    "users",
    Selectable<Database["users"]>,
    InsertedUser,
    Partial<InsertedUser>,
    ["id"]
  > {
    constructor(db: Kysely<Database>) {
      super(db, "users", {
        insertTransform: (source) => ({
          name: `${source.firstName} ${source.lastName}`,
          handle: source.handle,
          email: source.email,
        }),
        returnColumns: ["id"],
      });
    }
  }

  it("transforms users for insertion without transforming return", async () => {
    const insertTransformFacet = new InsertTransformFacet(db);

    const insertReturn = await insertTransformFacet.insertOne(insertedUser1);
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
      ReturnedUser
    > {
      constructor(db: Kysely<Database>) {
        super(db, "users", {
          returnColumns: ["id"],
          insertReturnTransform: (source, returns) =>
            new ReturnedUser(
              returns.id,
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
      ReturnedUser
    > {
      constructor(db: Kysely<Database>) {
        super(db, "users", {
          insertTransform: (source) => ({
            name: `${source.firstName} ${source.lastName}`,
            handle: source.handle,
            email: source.email,
          }),
          returnColumns: ["id"],
          insertReturnTransform: (source, returns) =>
            new ReturnedUser(
              returns.id,
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

  it("errors when providing an empty returnColumns array", () => {
    expect(
      () =>
        new StandardFacet(db, "users", {
          insertReturnTransform: (source, _returns) => source,
          returnColumns: [],
        })
    ).toThrow("No 'returnColumns' returned for 'insertReturnTransform'");
  });

  it("errors when providing insertReturnTransform but not returnColumns", () => {
    expect(
      () =>
        new StandardFacet(db, "users", {
          insertReturnTransform: (source, _returns) => source,
        })
    ).toThrow("'insertReturnTransform' requires 'returnColumns'");
  });

  ignore("detects insertion transformation type errors", async () => {
    const insertTransformFacet = new InsertTransformFacet(db);

    // @ts-expect-error - requires InsertedType as input
    await insertTransformFacet.insertOne(USERS[0]);
    // @ts-expect-error - requires InsertedType as input
    await insertTransformFacet.insertOne(selectedUser1);
  });
});
