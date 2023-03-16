/**
 * Tests QueryFacet.selectMany(), QueryFacet.selectOne(), and query filters.
 */

import { Kysely } from "kysely";

import { QueryFacet } from "../facets/QueryFacet";
import { TableFacet } from "../facets/TableFacet";
import { createDB, resetDB, destroyDB } from "./utils/test-setup";
import { Database } from "./utils/test-tables";
import { UserTableFacetReturningID } from "./utils/test-facets";
import { POSTS, USERS } from "./utils/test-objects";
import { ignore } from "@fieldzoo/testing-utils";
import { allOf, anyOf } from "../filters/CompoundFilter";

let db: Kysely<Database>;
let userQueryFacet: QueryFacet<Database, "users", object>;
let userTableFacet: UserTableFacetReturningID;

beforeAll(async () => {
  db = await createDB();
  userQueryFacet = new QueryFacet(db, db.selectFrom("users"));
  userTableFacet = new UserTableFacetReturningID(db);
});
beforeEach(() => resetDB(db));
afterAll(() => destroyDB(db));

it("selectQB() allows for selecting rows", async () => {
  await userTableFacet.insert(USERS);
  const users1 = await userQueryFacet.selectQB("handle").execute();
  expect(users1).toEqual(USERS.map((u) => ({ handle: u.handle })));

  const users2 = await userQueryFacet.selectQB(["name", "handle"]).execute();
  expect(users2).toEqual(
    USERS.map((u) => ({ name: u.name, handle: u.handle }))
  );
});

describe("subselectMany()", () => {
  it("returning all, selects nothing when nothing matches filter", async () => {
    await userTableFacet.insert(USERS);
    const users = await userQueryFacet.subselectMany(
      { name: "nonexistent" },
      []
    );
    expect(users).toEqual([]);
  });

  it("returning all, selects rows matching filter", async () => {
    await userTableFacet.insert(USERS);
    const expectedUsers = [
      Object.assign({}, USERS[0], { id: 1 }),
      Object.assign({}, USERS[2], { id: 3 }),
    ];

    let users = await userQueryFacet.subselectMany({
      name: USERS[0].name,
    });
    expect(users).toEqual(expectedUsers);

    users = await userQueryFacet.subselectMany({ name: USERS[0].name }, []);
    expect(users).toEqual(expectedUsers);
  });

  it("returning all, selects rows matching compound filter", async () => {
    await userTableFacet.insert(USERS);
    const users = await userQueryFacet.subselectMany(
      allOf({ name: USERS[0].name }, ["id", ">", 1]),
      []
    );
    expect(users).toEqual([Object.assign({}, USERS[2], { id: 3 })]);
  });

  it("returning some, selects nothing when nothing matches filter", async () => {
    await userTableFacet.insert(USERS);
    const users = await userQueryFacet.subselectMany({ name: "nonexistent" }, [
      "handle",
    ]);
    expect(users).toEqual([]);
  });

  it("returning some, selects rows matching filter", async () => {
    await userTableFacet.insert(USERS);
    let users = await userQueryFacet.subselectMany({ name: USERS[0].name }, [
      "handle",
    ]);
    expect(users).toEqual([
      { handle: USERS[0].handle },
      { handle: USERS[2].handle },
    ]);

    users = await userQueryFacet.subselectMany({ name: USERS[0].name }, [
      "handle",
      "email",
    ]);
    expect(users).toEqual([
      { handle: USERS[0].handle, email: USERS[0].email },
      { handle: USERS[2].handle, email: USERS[2].email },
    ]);
  });

  it("subselects many from a multi-table query, unfiltered", async () => {
    const postTableFacet = new TableFacet(db, "posts");
    const insertReturns = await userTableFacet.insertReturning(USERS);
    const post0 = Object.assign({}, POSTS[0], { userId: insertReturns[0].id });
    const post1 = Object.assign({}, POSTS[1], { userId: insertReturns[1].id });
    const post2 = Object.assign({}, POSTS[2], { userId: insertReturns[1].id });
    await postTableFacet.insertReturning([post0, post1, post2]);

    const joinedFacet = new QueryFacet(
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
    const postTableFacet = new TableFacet(db, "posts");
    const userReturns = await userTableFacet.insertReturning(USERS);
    const post0 = Object.assign({}, POSTS[0], { userId: userReturns[0].id });
    const post1 = Object.assign({}, POSTS[1], { userId: userReturns[1].id });
    const post2 = Object.assign({}, POSTS[2], { userId: userReturns[1].id });
    await postTableFacet.insertReturning([post0, post1, post2]);
    const joinedFacet = new QueryFacet(
      db,
      db
        .selectFrom("users")
        .innerJoin("posts", "users.id", "posts.userId")
        .orderBy("title")
    );

    // test filteringn on a table column
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

    // test filtering on a joined column
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
    userQueryFacet.subselectMany("name = 'John Doe'", []);
    // @ts-expect-error - doesn't allow only two arguments of a binary op
    userQueryFacet.subselectMany(["name", "="], []);
    // @ts-expect-error - object filter fields must be valid
    userQueryFacet.subselectMany({ notThere: "xyz" }, []);
    // @ts-expect-error - binary op filter fields must be valid
    userQueryFacet.subselectMany(["notThere", "=", "foo"], []);
    // @ts-expect-error - binary op filter fields must be valid
    userQueryFacet.subselectMany(["users.notThere", "=", "foo"], []);
    // @ts-expect-error - only table columns are accessible
    (await userQueryFacet.subselectMany({}, []))[0].notThere;
    // @ts-expect-error - only valid return columns are allowed
    userQueryFacet.subselectMany({}, ["notThere"]);
    // @ts-expect-error - only valid return columns are allowed
    userQueryFacet.subselectMany({}, ["users.notThere"]);
    // @ts-expect-error - only returned columns are accessible
    (await userQueryFacet.subselectMany({}, ["id"]))[0].name;
    // @ts-expect-error - only table columns are accessible w/ object filter
    (await userQueryFacet.subselectMany({ name: "Sue" }, []))[0].notThere;
    await userQueryFacet.subselectMany(
      // @ts-expect-error - only table columns are accessible via anyOf()
      anyOf({ notThere: "xyz" }, ["alsoNotThere", "=", "Sue"]),
      []
    );
    await userQueryFacet.subselectMany(
      // @ts-expect-error - only table columns are accessible via allOf()
      allOf({ notThere: "xyz" }, ["alsoNotThere", "=", "Sue"]),
      []
    );
  });
});

describe("subselectOne()", () => {
  it("returning all, selects nothing when nothing matches filter", async () => {
    await userTableFacet.insert(USERS);
    const user = await userQueryFacet.subselectOne({ name: "nonexistent" }, []);
    expect(user).toBeNull();
  });

  it("returning all, selects row matching filter", async () => {
    await userTableFacet.insert(USERS);

    let user = await userQueryFacet.subselectOne({
      name: USERS[0].name,
    });
    expect(user).toEqual(Object.assign({}, USERS[0], { id: 1 }));

    user = await userQueryFacet.subselectOne({ name: USERS[0].name }, []);
    expect(user).toEqual(Object.assign({}, USERS[0], { id: 1 }));
  });

  it("returning all, selects row matching compound filter", async () => {
    await userTableFacet.insert(USERS);
    const user = await userQueryFacet.subselectOne(
      allOf({ name: USERS[0].name }, ["id", ">", 1]),
      []
    );
    expect(user).toEqual(Object.assign({}, USERS[2], { id: 3 }));
  });

  it("returning some, selects nothing when nothing matches filter", async () => {
    await userTableFacet.insert(USERS);
    const user = await userQueryFacet.subselectOne({ name: "nonexistent" }, [
      "handle",
    ]);
    expect(user).toBeNull();
  });

  it("returning some, selects row matching filter", async () => {
    await userTableFacet.insert(USERS);
    let user = await userQueryFacet.subselectOne({ name: USERS[0].name }, [
      "handle",
    ]);
    expect(user).toEqual({ handle: USERS[0].handle });

    user = await userQueryFacet.subselectOne({ name: USERS[0].name }, [
      "handle",
      "email",
    ]);
    expect(user).toEqual({ handle: USERS[0].handle, email: USERS[0].email });
  });

  it("subselects one from a multi-table query, unfiltered", async () => {
    const postTableFacet = new TableFacet(db, "posts");
    const insertReturns = await userTableFacet.insertReturning(USERS);
    const post0 = Object.assign({}, POSTS[0], { userId: insertReturns[0].id });
    const post1 = Object.assign({}, POSTS[1], { userId: insertReturns[1].id });
    const post2 = Object.assign({}, POSTS[2], { userId: insertReturns[1].id });
    await postTableFacet.insertReturning([post0, post1, post2]);

    const joinedFacet = new QueryFacet(
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
        .orderBy("title", "desc")
    );

    // test filtering on table column
    const userPost1 = await joinedFacet.subselectOne(
      {
        handle: USERS[1].handle,
      },
      ["handle", "posts.title as t"]
    );
    expect(userPost1).toEqual({ handle: USERS[1].handle, t: POSTS[2].title });

    // test filtering on joined column
    const userPost2 = await joinedFacet.subselectOne(
      {
        "posts.title": POSTS[0].title,
      },
      ["handle"]
    );
    expect(userPost2).toEqual({ handle: USERS[0].handle });

    // test filtering on joined generated column
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
    userQueryFacet.subselectOne("name = 'John Doe'", []);
    // @ts-expect-error - doesn't allow only two arguments of a binary op
    userQueryFacet.subselectOne(["name", "="], []);
    // @ts-expect-error - object filter fields must be valid
    userQueryFacet.subselectOne({ notThere: "xyz" }, []);
    // @ts-expect-error - binary op filter fields must be valid
    userQueryFacet.subselectOne(["notThere", "=", "foo"], []);
    // @ts-expect-error - binary op filter fields must be valid
    userQueryFacet.subselectOne(["users.notThere", "=", "foo"], []);
    // @ts-expect-error - only valid return columns are allowed
    userQueryFacet.subselectOne({}, ["notThere"]);
    // @ts-expect-error - only valid return columns are allowed
    userQueryFacet.subselectOne({}, ["users.notThere"]);
    // @ts-expect-error - only table columns are accessible
    (await userQueryFacet.subselectOne({}, []))?.notThere;
    // @ts-expect-error - only returned columns are accessible
    (await userQueryFacet.subselectOne({}, ["id"]))?.name;
    // @ts-expect-error - only table columns are accessible w/ object filter
    (await userQueryFacet.subselectOne({ name: "Sue" }, []))?.notThere;
    await userQueryFacet.subselectOne(
      // @ts-expect-error - only table columns are accessible via anyOf()
      anyOf({ notThere: "xyz" }, ["alsoNotThere", "=", "Sue"]),
      []
    );
    await userQueryFacet.subselectOne(
      // @ts-expect-error - only table columns are accessible via allOf()
      allOf({ notThere: "xyz" }, ["alsoNotThere", "=", "Sue"]),
      []
    );
  });
});
