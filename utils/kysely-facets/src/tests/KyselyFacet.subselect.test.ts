/**
 * Tests KyselyFacet.selectMany(), KyselyFacet.selectOne(), and query filters.
 */

import { Kysely } from "kysely";

import { KyselyFacet, StandardFacet } from "..";
import { createDB, resetDB, destroyDB } from "./utils/test-setup";
import { Database } from "./utils/test-tables";
import { StdUserFacetReturningID } from "./utils/test-facets";
import { POSTS, USERS } from "./utils/test-objects";
import { ignore } from "@fieldzoo/testing-utils";
import { allOf, anyOf } from "../filters/CompoundFilter";

let db: Kysely<Database>;
let plainUserFacet: KyselyFacet<Database, "users", object>;
let stdUserFacet: StdUserFacetReturningID;

beforeAll(async () => {
  db = await createDB();
  plainUserFacet = new KyselyFacet(db, db.selectFrom("users"));
  stdUserFacet = new StdUserFacetReturningID(db);
});
beforeEach(() => resetDB(db));
afterAll(() => destroyDB(db));

it("selectQB() allows for selecting rows", async () => {
  await stdUserFacet.insert(USERS);
  const users1 = await plainUserFacet.selectQB("handle").execute();
  expect(users1).toEqual(USERS.map((u) => ({ handle: u.handle })));

  const users2 = await plainUserFacet.selectQB(["name", "handle"]).execute();
  expect(users2).toEqual(
    USERS.map((u) => ({ name: u.name, handle: u.handle }))
  );
});

describe("subselectMany()", () => {
  it("returning all, selects nothing when nothing matches filter", async () => {
    await stdUserFacet.insert(USERS);
    const users = await plainUserFacet.subselectMany(
      { name: "nonexistent" },
      []
    );
    expect(users).toEqual([]);
  });

  it("returning all, selects rows matching filter", async () => {
    await stdUserFacet.insert(USERS);
    const expectedUsers = [
      Object.assign({}, USERS[0], { id: 1 }),
      Object.assign({}, USERS[2], { id: 3 }),
    ];

    let users = await plainUserFacet.subselectMany({
      name: USERS[0].name,
    });
    expect(users).toEqual(expectedUsers);

    users = await plainUserFacet.subselectMany({ name: USERS[0].name }, []);
    expect(users).toEqual(expectedUsers);
  });

  it("returning all, selects rows matching compound filter", async () => {
    await stdUserFacet.insert(USERS);
    const users = await plainUserFacet.subselectMany(
      allOf({ name: USERS[0].name }, ["id", ">", 1]),
      []
    );
    expect(users).toEqual([Object.assign({}, USERS[2], { id: 3 })]);
  });

  it("returning some, selects nothing when nothing matches filter", async () => {
    await stdUserFacet.insert(USERS);
    const users = await plainUserFacet.subselectMany({ name: "nonexistent" }, [
      "handle",
    ]);
    expect(users).toEqual([]);
  });

  it("returning some, selects rows matching filter", async () => {
    await stdUserFacet.insert(USERS);
    let users = await plainUserFacet.subselectMany({ name: USERS[0].name }, [
      "handle",
    ]);
    expect(users).toEqual([
      { handle: USERS[0].handle },
      { handle: USERS[2].handle },
    ]);

    users = await plainUserFacet.subselectMany({ name: USERS[0].name }, [
      "handle",
      "email",
    ]);
    expect(users).toEqual([
      { handle: USERS[0].handle, email: USERS[0].email },
      { handle: USERS[2].handle, email: USERS[2].email },
    ]);
  });

  it("subselects many from a multi-table query, unfiltered", async () => {
    const stdPostFacet = new StandardFacet(db, "posts");
    const insertReturns = await stdUserFacet.insertReturning(USERS);
    const post0 = Object.assign({}, POSTS[0], { userId: insertReturns[0].id });
    const post1 = Object.assign({}, POSTS[1], { userId: insertReturns[1].id });
    const post2 = Object.assign({}, POSTS[2], { userId: insertReturns[1].id });
    await stdPostFacet.insertReturning([post0, post1, post2]);

    const joinedFacet = new KyselyFacet(
      db,
      db
        .selectFrom("users")
        .innerJoin("posts", "users.id", "posts.userId")
        .orderBy("title")
    );

    const userPosts1 = await joinedFacet.subselectMany({}, [
      "handle",
      "posts.title",
    ]);
    expect(userPosts1).toEqual([
      { handle: USERS[0].handle, title: POSTS[0].title },
      { handle: USERS[1].handle, title: POSTS[1].title },
      { handle: USERS[1].handle, title: POSTS[2].title },
    ]);
  });

  it("subselects many from a multi-table query, filtered", async () => {
    const stdPostFacet = new StandardFacet(db, "posts");
    const userReturns = await stdUserFacet.insertReturning(USERS);
    const post0 = Object.assign({}, POSTS[0], { userId: userReturns[0].id });
    const post1 = Object.assign({}, POSTS[1], { userId: userReturns[1].id });
    const post2 = Object.assign({}, POSTS[2], { userId: userReturns[1].id });
    await stdPostFacet.insertReturning([post0, post1, post2]);

    const joinedFacet = new KyselyFacet(
      db,
      db
        .selectFrom("users")
        .innerJoin("posts", "users.id", "posts.userId")
        .orderBy("title")
    );

    const userPosts1 = await joinedFacet.subselectMany(
      {
        handle: USERS[1].handle,
      },
      ["handle", "posts.title as t"]
    );
    expect(userPosts1).toEqual([
      { handle: USERS[1].handle, t: POSTS[1].title },
      { handle: USERS[1].handle, t: POSTS[2].title },
    ]);

    const userPosts2 = await joinedFacet.subselectMany(
      {
        "posts.userId": userReturns[1].id,
      },
      ["title"]
    );
    expect(userPosts2).toEqual([
      { title: POSTS[1].title },
      { title: POSTS[2].title },
    ]);
  });

  ignore("detects subselectMany() type errors", async () => {
    // @ts-expect-error - doesn't allow plain string expression filters
    plainUserFacet.subselectMany("name = 'John Doe'", []);
    // @ts-expect-error - doesn't allow only two arguments of a binary op
    plainUserFacet.subselectMany(["name", "="], []);
    // @ts-expect-error - object filter fields must be valid
    plainUserFacet.subselectMany({ notThere: "xyz" }, []);
    // @ts-expect-error - binary op filter fields must be valid
    plainUserFacet.subselectMany(["notThere", "=", "foo"], []);
    // @ts-expect-error - only table columns are accessible
    (await plainUserFacet.subselectMany({}, []))[0].notThere;
    // @ts-expect-error - only returned columns are accessible
    (await plainUserFacet.subselectMany({}, ["id"]))[0].name;
    // @ts-expect-error - only table columns are accessible w/ object filter
    (await plainUserFacet.subselectMany({ name: "Sue" }, []))[0].notThere;
    await plainUserFacet.subselectMany(
      // @ts-expect-error - only table columns are accessible via anyOf()
      anyOf({ notThere: "xyz" }, ["alsoNotThere", "=", "Sue"]),
      []
    );
    await plainUserFacet.subselectMany(
      // @ts-expect-error - only table columns are accessible via allOf()
      allOf({ notThere: "xyz" }, ["alsoNotThere", "=", "Sue"]),
      []
    );
  });
});

describe("subselectOne()", () => {
  it("returning all, selects nothing when nothing matches filter", async () => {
    await stdUserFacet.insert(USERS);
    const user = await plainUserFacet.subselectOne({ name: "nonexistent" }, []);
    expect(user).toBeNull();
  });

  it("returning all, selects row matching filter", async () => {
    await stdUserFacet.insert(USERS);

    let user = await plainUserFacet.subselectOne({
      name: USERS[0].name,
    });
    expect(user).toEqual(Object.assign({}, USERS[0], { id: 1 }));

    user = await plainUserFacet.subselectOne({ name: USERS[0].name }, []);
    expect(user).toEqual(Object.assign({}, USERS[0], { id: 1 }));
  });

  it("returning all, selects row matching compound filter", async () => {
    await stdUserFacet.insert(USERS);
    const user = await plainUserFacet.subselectOne(
      allOf({ name: USERS[0].name }, ["id", ">", 1]),
      []
    );
    expect(user).toEqual(Object.assign({}, USERS[2], { id: 3 }));
  });

  it("returning some, selects nothing when nothing matches filter", async () => {
    await stdUserFacet.insert(USERS);
    const user = await plainUserFacet.subselectOne({ name: "nonexistent" }, [
      "handle",
    ]);
    expect(user).toBeNull();
  });

  it("returning some, selects row matching filter", async () => {
    await stdUserFacet.insert(USERS);
    let user = await plainUserFacet.subselectOne({ name: USERS[0].name }, [
      "handle",
    ]);
    expect(user).toEqual({ handle: USERS[0].handle });

    user = await plainUserFacet.subselectOne({ name: USERS[0].name }, [
      "handle",
      "email",
    ]);
    expect(user).toEqual({ handle: USERS[0].handle, email: USERS[0].email });
  });

  it("subselects one from a multi-table query, unfiltered", async () => {
    const stdPostFacet = new StandardFacet(db, "posts");
    const insertReturns = await stdUserFacet.insertReturning(USERS);
    const post0 = Object.assign({}, POSTS[0], { userId: insertReturns[0].id });
    const post1 = Object.assign({}, POSTS[1], { userId: insertReturns[1].id });
    const post2 = Object.assign({}, POSTS[2], { userId: insertReturns[1].id });
    await stdPostFacet.insertReturning([post0, post1, post2]);

    const joinedFacet = new KyselyFacet(
      db,
      db
        .selectFrom("users")
        .innerJoin("posts", "users.id", "posts.userId")
        .orderBy("title", "desc")
    );

    const userPosts1 = await joinedFacet.subselectOne({}, [
      "handle",
      "posts.title",
    ]);
    expect(userPosts1).toEqual({
      handle: USERS[1].handle,
      title: POSTS[2].title,
    });
  });

  it("subselects one from a multi-table query, filtered", async () => {
    const stdPostFacet = new StandardFacet(db, "posts");
    const userReturns = await stdUserFacet.insertReturning(USERS);
    const post0 = Object.assign({}, POSTS[0], { userId: userReturns[0].id });
    const post1 = Object.assign({}, POSTS[1], { userId: userReturns[1].id });
    const post2 = Object.assign({}, POSTS[2], { userId: userReturns[1].id });
    const postReturns = await stdPostFacet.insertReturning([
      post0,
      post1,
      post2,
    ]);

    const joinedFacet = new KyselyFacet(
      db,
      db
        .selectFrom("users")
        .innerJoin("posts", "users.id", "posts.userId")
        .orderBy("title", "desc")
    );

    const userPost1 = await joinedFacet.subselectOne(
      {
        handle: USERS[1].handle,
      },
      ["handle", "posts.title as t"]
    );
    expect(userPost1).toEqual({ handle: USERS[1].handle, t: POSTS[2].title });

    const userPost2 = await joinedFacet.subselectOne(
      {
        "posts.title": POSTS[0].title,
      },
      ["handle"]
    );
    expect(userPost2).toEqual({ handle: USERS[0].handle });

    const userPost3 = await joinedFacet.subselectOne(
      {
        "posts.id": postReturns[0].id,
      },
      ["title"]
    );
    expect(userPost3).toEqual({ title: POSTS[0].title });
  });

  ignore("detects subselectOne() type errors", async () => {
    // @ts-expect-error - doesn't allow plain string expression filters
    plainUserFacet.subselectOne("name = 'John Doe'", []);
    // @ts-expect-error - doesn't allow only two arguments of a binary op
    plainUserFacet.subselectOne(["name", "="], []);
    // @ts-expect-error - object filter fields must be valid
    plainUserFacet.subselectOne({ notThere: "xyz" }, []);
    // @ts-expect-error - binary op filter fields must be valid
    plainUserFacet.subselectOne(["notThere", "=", "foo"], []);
    // @ts-expect-error - only table columns are accessible
    (await plainUserFacet.subselectOne({}, []))?.notThere;
    // @ts-expect-error - only returned columns are accessible
    (await plainUserFacet.subselectOne({}, ["id"]))?.name;
    // @ts-expect-error - only table columns are accessible w/ object filter
    (await plainUserFacet.subselectOne({ name: "Sue" }, []))?.notThere;
    await plainUserFacet.subselectOne(
      // @ts-expect-error - only table columns are accessible via anyOf()
      anyOf({ notThere: "xyz" }, ["alsoNotThere", "=", "Sue"]),
      []
    );
    await plainUserFacet.subselectOne(
      // @ts-expect-error - only table columns are accessible via allOf()
      allOf({ notThere: "xyz" }, ["alsoNotThere", "=", "Sue"]),
      []
    );
  });
});
