/**
 * Tests QueryFacet.selectMany(), QueryFacet.selectOne(), and query filters.
 */

import { Kysely, Selectable, sql } from "kysely";

import { QueryFacet } from "../facets/QueryFacet";
import { TableFacet } from "../facets/TableFacet";
import { createDB, resetDB, destroyDB } from "./utils/test-setup";
import { Database, Users } from "./utils/test-tables";
import { UserTableFacetReturningID } from "./utils/test-facets";
import { POSTS, USERS } from "./utils/test-objects";
import { ignore } from "@fieldzoo/testing-utils";
import { allOf, anyOf } from "../filters/CompoundFilter";

let db: Kysely<Database>;
let userQueryFacet: QueryFacet<Database, "users", Partial<Selectable<Users>>>;
let userTableFacet: UserTableFacetReturningID;

beforeAll(async () => {
  db = await createDB();
  userQueryFacet = new QueryFacet(db, db.selectFrom("users"));
  userTableFacet = new UserTableFacetReturningID(db);
});
beforeEach(() => resetDB(db));
afterAll(() => destroyDB(db));

it("selectAllQB() allows for selecting rows", async () => {
  await db
    .insertInto("users")
    .values(USERS[0])
    .returningAll()
    .executeTakeFirst()!;
  const user1 = (await db
    .insertInto("users")
    .values(USERS[1])
    .returningAll()
    .executeTakeFirst())!;

  const readUser1 = await userQueryFacet
    .selectAllQB()
    .where("id", "=", user1.id)
    .executeTakeFirst();
  expect(readUser1?.handle).toEqual(USERS[1].handle);
  expect(readUser1?.email).toEqual(USERS[1].email);
});

describe("selectMany() with simple filters", () => {
  it("selects nothing when nothing matches filter", async () => {
    await userTableFacet.insert(USERS);

    const users = await userQueryFacet.selectMany({ name: "Not There" });
    expect(users.length).toEqual(0);
  });

  it("selects all rows with no filter", async () => {
    await userTableFacet.insert(USERS);

    // Test selecting all
    const users = await userQueryFacet.selectMany({});
    expect(users.length).toEqual(USERS.length);
    for (let i = 0; i < USERS.length; i++) {
      expect(users[i].handle).toEqual(USERS[i].handle);
    }
  });

  it("selects with a matching field filter", async () => {
    await userTableFacet.insert(USERS);

    let users = await userQueryFacet.selectMany({
      name: USERS[0].name,
    });
    expect(users.length).toEqual(2);
    expect(users[0].handle).toEqual(USERS[0].handle);
    expect(users[1].handle).toEqual(USERS[2].handle);

    users = await userQueryFacet.selectMany({
      name: USERS[0].name,
      handle: USERS[2].handle,
    });
    expect(users.length).toEqual(1);
    expect(users[0].handle).toEqual(USERS[2].handle);
  });

  it("selects with a binary operation filter", async () => {
    await userTableFacet.insert(USERS);

    // Test selecting by condition (with results)
    let users = await userQueryFacet.selectMany(["name", "=", USERS[0].name]);
    expect(users.length).toEqual(2);
    expect(users[0].handle).toEqual(USERS[0].handle);
    expect(users[1].handle).toEqual(USERS[2].handle);

    // Test selecting by condition (no results)
    users = await userQueryFacet.selectMany(["name", "=", "nonexistent"]);
    expect(users.length).toEqual(0);
  });

  it("selects with a query builder filter", async () => {
    await userTableFacet.insert(USERS);

    const users = await userQueryFacet.selectMany((qb) =>
      qb.where("name", "=", USERS[0].name).orderBy("handle", "desc")
    );
    expect(users.length).toEqual(2);
    expect(users[0].handle).toEqual(USERS[2].handle);
    expect(users[1].handle).toEqual(USERS[0].handle);
  });

  it("selects with a query expression filter", async () => {
    await userTableFacet.insert(USERS);

    const users = await userQueryFacet.selectMany(
      sql`name != ${USERS[0].name}`
    );
    expect(users.length).toEqual(1);
    expect(users[0].handle).toEqual(USERS[1].handle);
  });

  it("throws on unrecognized filter", async () => {
    expect(userTableFacet.selectMany("" as any)).rejects.toThrow(
      "Unrecognized query filter"
    );
  });

  it("selects many from a multi-table query, unfiltered", async () => {
    const postTableFacet = new TableFacet(db, "posts");
    const insertReturns = await userTableFacet.insertReturning(USERS);
    const post0 = Object.assign({}, POSTS[0], { userId: insertReturns[0].id });
    const post1 = Object.assign({}, POSTS[1], { userId: insertReturns[1].id });
    const post2 = Object.assign({}, POSTS[2], { userId: insertReturns[1].id });
    const postReturns = await postTableFacet.insertReturning([
      post0,
      post1,
      post2,
    ]);

    const joinedFacet = new QueryFacet(
      db,
      db
        .selectFrom("users")
        .innerJoin("posts", "users.id", "posts.userId")
        .orderBy("title")
    );

    const userPosts: any[] = await joinedFacet.selectMany({});
    for (const userPost of userPosts) {
      delete userPost.createdAt;
    }

    expect(userPosts).toEqual([
      Object.assign({}, USERS[0], POSTS[0], {
        id: postReturns[0].id,
        userId: insertReturns[0].id,
      }),
      Object.assign({}, USERS[1], POSTS[1], {
        id: postReturns[1].id,
        userId: insertReturns[1].id,
      }),
      Object.assign({}, USERS[1], POSTS[2], {
        id: postReturns[2].id,
        userId: insertReturns[1].id,
      }),
    ]);
  });

  it("selects many from a multi-table query, filtered", async () => {
    const postTableFacet = new TableFacet(db, "posts");
    const userReturns = await userTableFacet.insertReturning(USERS);
    const post0 = Object.assign({}, POSTS[0], { userId: userReturns[0].id });
    const post1 = Object.assign({}, POSTS[1], { userId: userReturns[1].id });
    const post2 = Object.assign({}, POSTS[2], { userId: userReturns[1].id });
    const postReturns = await postTableFacet.insertReturning([
      post0,
      post1,
      post2,
    ]);
    const joinedFacet = new QueryFacet(
      db,
      db
        .selectFrom("users")
        .innerJoin("posts", "users.id", "posts.userId")
        .orderBy("title")
    );
    const user1Posts = [
      Object.assign({}, USERS[1], POSTS[1], {
        id: postReturns[1].id,
        userId: userReturns[1].id,
      }),
      Object.assign({}, USERS[1], POSTS[2], {
        id: postReturns[2].id,
        userId: userReturns[1].id,
      }),
    ];

    // test filtering on a table column
    const userPosts1: any[] = await joinedFacet.selectMany({
      handle: USERS[1].handle,
    });
    for (const userPost of userPosts1) {
      delete userPost.createdAt;
    }
    expect(userPosts1).toEqual(user1Posts);

    // test filtering on a joined column
    const userPosts2: any[] = await joinedFacet.selectMany({
      "posts.userId": userReturns[1].id,
    });
    for (const userPost of userPosts2) {
      delete userPost.createdAt;
    }
    expect(userPosts2).toEqual(user1Posts);
  });

  ignore("detects selectMany() simple filter type errors", async () => {
    // @ts-expect-error - doesn't allow plain string expressions
    userQueryFacet.selectMany("name = 'John Doe'");
    // @ts-expect-error - doesn't allow only two arguments
    userQueryFacet.selectMany("name", "=");
    // @ts-expect-error - object filter fields must be valid
    userQueryFacet.selectMany({ notThere: "xyz" });
    // @ts-expect-error - binary op filter fields must be valid
    userQueryFacet.selectMany(["notThere", "=", "foo"]);
    // @ts-expect-error - binary op filter fields must be valid
    userQueryFacet.selectMany(["users.notThere", "=", "foo"]);
    // @ts-expect-error - only table columns are accessible unfiltered
    (await userQueryFacet.selectMany({}))[0].notThere;
    // @ts-expect-error - only table columns are accessible w/ object filter
    (await userQueryFacet.selectMany({ name: "Sue" }))[0].notThere;
    // @ts-expect-error - only table columns are accessible w/ op filter
    (await userQueryFacet.selectMany(["name", "=", "Sue"]))[0].notThere;
    // @ts-expect-error - only table columns are accessible w/ QB filter
    (await userQueryFacet.selectMany((qb) => qb))[0].notThere;
    // @ts-expect-error - only table columns are accessible w/ expr filter
    (await userQueryFacet.selectMany(sql`name = 'Sue'`))[0].notThere;
  });
});

describe("selectMany() with compound filters", () => {
  it("selects with allOf()", async () => {
    //const allOf = userTableFacet.selectFilterMaker().allOf;
    const userIDs = await userTableFacet.insertReturning(USERS);

    const users = await userQueryFacet.selectMany(
      allOf({ name: USERS[0].name }, ["id", ">", userIDs[0].id])
    );
    expect(users.length).toEqual(1);
    expect(users[0].handle).toEqual(USERS[2].handle);
  });

  it("selects with anyOf()", async () => {
    await userTableFacet.insert(USERS);

    const users = await userQueryFacet.selectMany(
      anyOf({ handle: USERS[0].handle }, ["handle", "=", USERS[2].handle])
    );
    expect(users.length).toEqual(2);
    expect(users[0].handle).toEqual(USERS[0].handle);
    expect(users[1].handle).toEqual(USERS[2].handle);
  });

  it("selects with anyOf() and a nested allOf()", async () => {
    const userIDs = await userTableFacet.insertReturning(USERS);

    const users = await userQueryFacet.selectMany(
      anyOf(
        { handle: USERS[0].handle },
        allOf(["id", ">", userIDs[0].id], (qb) =>
          qb.where("name", "=", USERS[0].name)
        )
      )
    );
    expect(users.length).toEqual(2);
    expect(users[0].handle).toEqual(USERS[0].handle);
    expect(users[1].handle).toEqual(USERS[2].handle);
  });

  ignore("detects selectMany() compound filter type errors", async () => {
    await userQueryFacet.selectMany(
      // @ts-expect-error - only table columns are accessible via anyOf()
      anyOf({ notThere: "xyz" }, ["alsoNotThere", "=", "Sue"])
    );
    await userQueryFacet.selectMany(
      // @ts-expect-error - only table columns are accessible via allOf()
      allOf({ notThere: "xyz" }, ["alsoNotThere", "=", "Sue"])
    );
    await userQueryFacet.selectMany(
      // @ts-expect-error - only table columns are accessible via anyOf()
      anyOf({ name: "xyz" }, allOf(["notThere", "=", "Sue"]))
    );
    await userQueryFacet.selectMany(
      // @ts-expect-error - only table columns are accessible via anyOf()
      allOf({ name: "xyz" }, anyOf(["notThere", "=", "Sue"]))
    );
  });
});

describe("selectOne()", () => {
  it("selects the first row with no filter", async () => {
    await userTableFacet.insert(USERS);

    const user = await userQueryFacet.selectOne({});
    expect(user?.handle).toEqual(USERS[0].handle);
  });

  it("selects the first row with a matching field filter", async () => {
    await userTableFacet.insert(USERS);

    let user = await userQueryFacet.selectOne({ name: USERS[0].name });
    expect(user?.handle).toEqual(USERS[0].handle);

    user = await userQueryFacet.selectOne({
      name: USERS[0].name,
      handle: USERS[2].handle,
    });
    expect(user?.handle).toEqual(USERS[2].handle);
  });

  it("selects the first row with a binary operation filter", async () => {
    await userTableFacet.insert(USERS);

    // Test selecting by condition (with result)
    let user = await userQueryFacet.selectOne(["name", "=", USERS[0].name]);
    expect(user?.handle).toEqual(USERS[0].handle);

    // Test selecting by condition (no result)
    user = await userQueryFacet.selectOne(["name", "=", "nonexistent"]);
    expect(user).toBeNull();
  });

  it("selects the first row with a query builder filter", async () => {
    await userTableFacet.insert(USERS);

    const user = await userQueryFacet.selectOne((qb) =>
      qb.where("name", "=", USERS[0].name).orderBy("handle", "desc")
    );
    expect(user?.handle).toEqual(USERS[2].handle);
  });

  it("selects the first row with a query expression filter", async () => {
    await userTableFacet.insert(USERS);

    const user = await userQueryFacet.selectOne(sql`name != ${USERS[0].name}`);
    expect(user?.handle).toEqual(USERS[1].handle);
  });

  it("selects the first row with a compound filter", async () => {
    const userIDs = await userTableFacet.insertReturning(USERS);

    const user = await userQueryFacet.selectOne(
      allOf({ name: USERS[0].name }, ["id", ">", userIDs[0].id])
    );
    expect(user?.handle).toEqual(USERS[2].handle);
  });

  it("throws on unrecognized filter", async () => {
    expect(userTableFacet.selectOne("" as any)).rejects.toThrow(
      "Unrecognized query filter"
    );
  });

  it("selects one from a multi-table query, unfiltered", async () => {
    const postTableFacet = new TableFacet(db, "posts");
    const insertReturns = await userTableFacet.insertReturning(USERS);
    const post0 = Object.assign({}, POSTS[0], { userId: insertReturns[0].id });
    const post1 = Object.assign({}, POSTS[1], { userId: insertReturns[1].id });
    const post2 = Object.assign({}, POSTS[2], { userId: insertReturns[1].id });
    const postReturns = await postTableFacet.insertReturning([
      post0,
      post1,
      post2,
    ]);

    const joinedFacet = new QueryFacet(
      db,
      db
        .selectFrom("users")
        .innerJoin("posts", "users.id", "posts.userId")
        .orderBy("title", "desc")
    );

    const userPost: any = await joinedFacet.selectOne({});
    delete userPost.createdAt;

    expect(userPost).toEqual(
      Object.assign({}, USERS[1], POSTS[2], {
        id: postReturns[2].id,
        userId: insertReturns[1].id,
      })
    );
  });

  it("selects one from a multi-table query, filtered", async () => {
    const postTableFacet = new TableFacet(db, "posts");
    const insertReturns = await userTableFacet.insertReturning(USERS);
    const post0 = Object.assign({}, POSTS[0], { userId: insertReturns[0].id });
    const post1 = Object.assign({}, POSTS[1], { userId: insertReturns[1].id });
    const post2 = Object.assign({}, POSTS[2], { userId: insertReturns[1].id });
    const postReturns = await postTableFacet.insertReturning([
      post0,
      post1,
      post2,
    ]);
    const joinedFacet = new QueryFacet(
      db,
      db
        .selectFrom("users")
        .innerJoin("posts", "users.id", "posts.userId")
        .orderBy("title")
    );

    // test filtering on a table column
    const userPost: any = await joinedFacet.selectOne({
      handle: USERS[1].handle,
    });
    delete userPost.createdAt;
    expect(userPost).toEqual(
      Object.assign({}, USERS[1], POSTS[1], {
        id: postReturns[1].id,
        userId: insertReturns[1].id,
      })
    );

    // teset filtering on a joined column
    const userPost3: any = await joinedFacet.subselectOne({
      "posts.id": postReturns[0].id,
    });
    delete userPost3.createdAt;
    expect(userPost3).toEqual(
      Object.assign({}, USERS[0], POSTS[0], {
        id: postReturns[0].id,
        userId: insertReturns[0].id,
      })
    );
  });

  ignore("detects selectOne() type errors", async () => {
    // @ts-expect-error - doesn't allow plain string expression filters
    userQueryFacet.selectOne("name = 'John Doe'");
    // @ts-expect-error - doesn't allow only two arguments of a binary op
    userQueryFacet.selectOne(["name", "="]);
    // @ts-expect-error - object filter fields must be valid
    userQueryFacet.selectOne({ notThere: "xyz" });
    // @ts-expect-error - binary op filter fields must be valid
    userQueryFacet.selectOne(["notThere", "=", "foo"]);
    // @ts-expect-error - binary op filter fields must be valid
    userQueryFacet.selectOne(["users.notThere", "=", "foo"]);
    // @ts-expect-error - only table columns are accessible unfiltered
    (await userQueryFacet.selectOne({})).notThere;
    // @ts-expect-error - only table columns are accessible w/ object filter
    (await userQueryFacet.selectOne({ name: "Sue" })).notThere;
    // @ts-expect-error - only table columns are accessible w/ op filter
    (await userQueryFacet.selectOne(["name", "=", "Sue"])).notThere;
    // @ts-expect-error - only table columns are accessible w/ QB filter
    (await userQueryFacet.selectOne((qb) => qb)).notThere;
    // @ts-expect-error - only table columns are accessible w/ expr filter
    (await userQueryFacet.selectOne(sql`name = 'Sue'`)).notThere;
    await userQueryFacet.selectOne(
      // @ts-expect-error - only table columns are accessible via anyOf()
      anyOf({ notThere: "xyz" }, ["alsoNotThere", "=", "Sue"])
    );
    await userQueryFacet.selectOne(
      // @ts-expect-error - only table columns are accessible via allOf()
      allOf({ notThere: "xyz" }, ["alsoNotThere", "=", "Sue"])
    );
    await userQueryFacet.selectOne(
      // @ts-expect-error - only table columns are accessible via anyOf()
      anyOf({ name: "xyz" }, allOf(["notThere", "=", "Sue"]))
    );
    await userQueryFacet.selectOne(
      // @ts-expect-error - only table columns are accessible via anyOf()
      allOf({ name: "xyz" }, anyOf(["notThere", "=", "Sue"]))
    );
  });
});
