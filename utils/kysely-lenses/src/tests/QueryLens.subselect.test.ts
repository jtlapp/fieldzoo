/**
 * Tests QueryLens.selectMany(), QueryLens.selectOne(), and query filters.
 */

import { Kysely, Selectable } from "kysely";

import { QueryLens } from "../lenses/QueryLens";
import { TableLens } from "../lenses/TableLens";
import { createDB, resetDB, destroyDB } from "./utils/test-setup";
import { Database, Users } from "./utils/test-tables";
import { UserTableLensReturningID } from "./utils/test-lenses";
import { POSTS, USERS } from "./utils/test-objects";
import { ignore } from "./utils/test-utils";

let db: Kysely<Database>;
let userQueryLens: QueryLens<Database, "users", Partial<Selectable<Users>>>;
let userTableLens: UserTableLensReturningID;

beforeAll(async () => {
  db = await createDB();
  userQueryLens = new QueryLens(db, db.selectFrom("users"));
  userTableLens = new UserTableLensReturningID(db);
});
beforeEach(() => resetDB(db));
afterAll(() => destroyDB(db));

it("selectQB() allows for selecting rows", async () => {
  await userTableLens.insert(USERS);
  const users1 = await userQueryLens.selectQB("handle").execute();
  expect(users1).toEqual(USERS.map((u) => ({ handle: u.handle })));

  const users2 = await userQueryLens.selectQB(["name", "handle"]).execute();
  expect(users2).toEqual(
    USERS.map((u) => ({ name: u.name, handle: u.handle }))
  );
});

describe("subselectMany()", () => {
  it("returning all, selects nothing when nothing matches filter", async () => {
    await userTableLens.insert(USERS);
    const users = await userQueryLens.subselectMany(
      { name: "nonexistent" },
      []
    );
    expect(users).toEqual([]);
  });

  it("returning all, selects rows matching filter", async () => {
    await userTableLens.insert(USERS);
    const expectedUsers = [
      Object.assign({}, USERS[0], { id: 1 }),
      Object.assign({}, USERS[2], { id: 3 }),
    ];

    let users = await userQueryLens.subselectMany({
      name: USERS[0].name,
    });
    expect(users).toEqual(expectedUsers);

    users = await userQueryLens.subselectMany({ name: USERS[0].name }, []);
    expect(users).toEqual(expectedUsers);
  });

  it("returning all, selects rows matching compound filter", async () => {
    await userTableLens.insert(USERS);
    const users = await userQueryLens.subselectMany(
      ({ and, cmpr }) =>
        and([cmpr("name", "=", USERS[0].name), cmpr("id", ">", 1)]),
      []
    );
    expect(users).toEqual([Object.assign({}, USERS[2], { id: 3 })]);
  });

  it("returning some, selects nothing when nothing matches filter", async () => {
    await userTableLens.insert(USERS);
    const users = await userQueryLens.subselectMany({ name: "nonexistent" }, [
      "handle",
    ]);
    expect(users).toEqual([]);
  });

  it("returning some, selects rows matching filter", async () => {
    await userTableLens.insert(USERS);
    let users = await userQueryLens.subselectMany({ name: USERS[0].name }, [
      "handle",
    ]);
    expect(users).toEqual([
      { handle: USERS[0].handle },
      { handle: USERS[2].handle },
    ]);

    users = await userQueryLens.subselectMany({ name: USERS[0].name }, [
      "handle",
      "email",
    ]);
    expect(users).toEqual([
      { handle: USERS[0].handle, email: USERS[0].email },
      { handle: USERS[2].handle, email: USERS[2].email },
    ]);
  });

  it("subselects many using a pre-configured aliased column", async () => {
    const ids = await userTableLens.insert(USERS);
    const lens = new QueryLens(db, db.selectFrom("users"), {
      columnAliases: ["handle as h"],
    });

    // subselects all columns, including pre-configured aliases
    const users = await lens.subselectMany({ name: USERS[0].name });
    expect(users).toEqual([
      Object.assign({}, USERS[0], { id: ids[0].id, h: USERS[0].handle }),
      Object.assign({}, USERS[2], { id: ids[2].id, h: USERS[2].handle }),
    ]);

    // subselects selected columns, including pre-configured aliases
    const users2 = await lens.subselectMany({ name: USERS[0].name }, [
      "id",
      "h",
    ]);
    expect(users2).toEqual([
      { id: ids[0].id, h: USERS[0].handle },
      { id: ids[2].id, h: USERS[2].handle },
    ]);

    ignore("detects type errors", async () => {
      // @ts-expect-error - columns not originally selected are not accessible
      (await lens.subselectMany({}, []))[0].notThere;

      // @ts-expect-error - columns not originally selected are not accessible
      (await joinedLens.subselectMany({}, ["handle"]))[0].name;
    });
  });

  it("subselects many from a multi-table query, unfiltered", async () => {
    const postTableLens = new TableLens(db, "posts", {
      returnColumns: ["id"],
    });
    const insertReturns = await userTableLens.insert(USERS);
    const post0 = Object.assign({}, POSTS[0], { userId: insertReturns[0].id });
    const post1 = Object.assign({}, POSTS[1], { userId: insertReturns[1].id });
    const post2 = Object.assign({}, POSTS[2], { userId: insertReturns[1].id });
    await postTableLens.insert([post0, post1, post2]);

    const joinedLens = new QueryLens(
      db,
      db
        .selectFrom("users")
        .innerJoin("posts", "users.id", "posts.userId")
        .orderBy("title")
    );

    const userPosts1 = await joinedLens.subselectMany({}, [
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
    const postTableLens = new TableLens(db, "posts", {
      returnColumns: ["id"],
    });
    const userReturns = await userTableLens.insert(USERS);
    const post0 = Object.assign({}, POSTS[0], { userId: userReturns[0].id });
    const post1 = Object.assign({}, POSTS[1], { userId: userReturns[1].id });
    const post2 = Object.assign({}, POSTS[2], { userId: userReturns[1].id });
    await postTableLens.insert([post0, post1, post2]);
    const joinedLens = new QueryLens(
      db,
      db
        .selectFrom("users")
        .innerJoin("posts", "users.id", "posts.userId")
        .orderBy("title")
    );

    // test filteringn on a table column
    const userPosts1 = await joinedLens.subselectMany(
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
    const userPosts2 = await joinedLens.subselectMany(
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

  it("subselects many from a pre-selected multi-table query", async () => {
    const postTableLens = new TableLens(db, "posts", {
      returnColumns: ["id"],
    });
    const userReturns = await userTableLens.insert(USERS);
    const post0 = Object.assign({}, POSTS[0], { userId: userReturns[0].id });
    const post1 = Object.assign({}, POSTS[1], { userId: userReturns[1].id });
    const post2 = Object.assign({}, POSTS[2], { userId: userReturns[1].id });
    const postReturns = await postTableLens.insert([post0, post1, post2]);

    const joinedLens = new QueryLens(
      db,
      db
        .selectFrom("users")
        .innerJoin("posts", "users.id", "posts.userId")
        .select(["posts.id as postId", "posts.title", "users.handle"])
        .orderBy("title")
    );

    // test returning all columns
    const userPosts1 = await joinedLens.subselectMany(
      { "posts.userId": userReturns[1].id },
      []
    );
    expect(userPosts1).toEqual([
      {
        postId: postReturns[1].id,
        title: POSTS[1].title,
        handle: USERS[1].handle,
      },
      {
        postId: postReturns[2].id,
        title: POSTS[2].title,
        handle: USERS[1].handle,
      },
    ]);

    // test returning specific columns
    const userPosts2 = await joinedLens.subselectMany(
      { "posts.userId": userReturns[1].id },
      ["handle", "posts.id as postId"]
    );
    expect(userPosts2).toEqual([
      { postId: postReturns[1].id, handle: USERS[1].handle },
      { postId: postReturns[2].id, handle: USERS[1].handle },
    ]);

    ignore("detects type errors", async () => {
      // prettier-ignore
      (await joinedLens.subselectMany(
        { "posts.userId": userReturns[1].id }, []
        // @ts-expect-error - columns not originally selected are not accessible
      ))[0].name;

      // prettier-ignore
      (await joinedLens.subselectMany(
        { "posts.userId": userReturns[1].id }, ["handle"]
        // @ts-expect-error - columns not originally selected are not accessible
      ))[0].title;
    });
  });

  ignore("detects subselectMany() type errors", async () => {
    // @ts-expect-error - doesn't allow plain string expression filters
    userQueryLens.subselectMany("name = 'John Doe'", []);
    // @ts-expect-error - doesn't allow only two arguments of a binary op
    userQueryLens.subselectMany(["name", "="], []);
    // @ts-expect-error - object filter fields must be valid
    userQueryLens.subselectMany({ notThere: "xyz" }, []);
    // @ts-expect-error - binary op filter fields must be valid
    userQueryLens.subselectMany(["notThere", "=", "foo"], []);
    // @ts-expect-error - binary op filter fields must be valid
    userQueryLens.subselectMany(["users.notThere", "=", "foo"], []);
    // @ts-expect-error - only table columns are accessible
    (await userQueryLens.subselectMany({}, []))[0].notThere;
    // @ts-expect-error - only valid return columns are allowed
    userQueryLens.subselectMany({}, ["notThere"]);
    // @ts-expect-error - only valid return columns are allowed
    userQueryLens.subselectMany({}, ["users.notThere"]);
    // @ts-expect-error - only returned columns are accessible
    (await userQueryLens.subselectMany({}, ["id"]))[0].name;
    // @ts-expect-error - only table columns are accessible w/ object filter
    (await userQueryLens.subselectMany({ name: "Sue" }, []))[0].notThere;
    await userQueryLens.subselectMany(
      ({ or, cmpr }) =>
        // @ts-expect-error - only table columns are accessible via anyOf()
        or([cmpr("notThere", "=", "xyz"), cmpr("alsoNotThere", "=", "Sue")]),
      []
    );
    await userQueryLens.subselectMany(
      ({ and, cmpr }) =>
        // @ts-expect-error - only table columns are accessible via allOf()
        and([cmpr("notThere", "=", "xyz"), cmpr("alsoNotThere", "=", "Sue")]),
      []
    );
  });
});

describe("subselectOne()", () => {
  it("returning all, selects nothing when nothing matches filter", async () => {
    await userTableLens.insert(USERS);
    const user = await userQueryLens.subselectOne({ name: "nonexistent" }, []);
    expect(user).toBeNull();
  });

  it("returning all, selects row matching filter", async () => {
    await userTableLens.insert(USERS);

    let user = await userQueryLens.subselectOne({
      name: USERS[0].name,
    });
    expect(user).toEqual(Object.assign({}, USERS[0], { id: 1 }));

    user = await userQueryLens.subselectOne({ name: USERS[0].name }, []);
    expect(user).toEqual(Object.assign({}, USERS[0], { id: 1 }));
  });

  it("returning all, selects row matching compound filter", async () => {
    await userTableLens.insert(USERS);
    const user = await userQueryLens.subselectOne(
      ({ and, cmpr }) =>
        and([cmpr("name", "=", USERS[0].name), cmpr("id", ">", 1)]),
      []
    );
    expect(user).toEqual(Object.assign({}, USERS[2], { id: 3 }));
  });

  it("returning some, selects nothing when nothing matches filter", async () => {
    await userTableLens.insert(USERS);
    const user = await userQueryLens.subselectOne({ name: "nonexistent" }, [
      "handle",
    ]);
    expect(user).toBeNull();
  });

  it("returning some, selects row matching filter", async () => {
    await userTableLens.insert(USERS);
    let user = await userQueryLens.subselectOne({ name: USERS[0].name }, [
      "handle",
    ]);
    expect(user).toEqual({ handle: USERS[0].handle });

    user = await userQueryLens.subselectOne({ name: USERS[0].name }, [
      "handle",
      "email",
    ]);
    expect(user).toEqual({ handle: USERS[0].handle, email: USERS[0].email });
  });

  it("subselects one using a pre-configured aliased column", async () => {
    const ids = await userTableLens.insert(USERS);
    const lens = new QueryLens(db, db.selectFrom("users"), {
      columnAliases: ["handle as h"],
    });

    // subselects all columns, including pre-configured aliases
    const user1 = await lens.subselectOne({ name: USERS[1].name });
    expect(user1).toEqual(
      Object.assign({}, USERS[1], { id: ids[1].id, h: USERS[1].handle })
    );

    // subselects selected columns, including pre-configured aliases
    const user2 = await lens.subselectOne({ name: USERS[1].name }, ["id", "h"]);
    expect(user2).toEqual({ id: ids[1].id, h: USERS[1].handle });

    ignore("detects type errors", async () => {
      // @ts-expect-error - columns not originally selected are not accessible
      (await lens.subselectOne({}, []))!.notThere;

      // @ts-expect-error - columns not originally selected are not accessible
      (await joinedLens.subselectOne({}, ["handle"]))!.name;
    });
  });

  it("subselects one from a multi-table query, unfiltered", async () => {
    const postTableLens = new TableLens(db, "posts", {
      returnColumns: ["id"],
    });
    const insertReturns = await userTableLens.insert(USERS);
    const post0 = Object.assign({}, POSTS[0], { userId: insertReturns[0].id });
    const post1 = Object.assign({}, POSTS[1], { userId: insertReturns[1].id });
    const post2 = Object.assign({}, POSTS[2], { userId: insertReturns[1].id });
    await postTableLens.insert([post0, post1, post2]);

    const joinedLens = new QueryLens(
      db,
      db
        .selectFrom("users")
        .innerJoin("posts", "users.id", "posts.userId")
        .orderBy("title", "desc")
    );

    const userPosts1 = await joinedLens.subselectOne({}, [
      "handle",
      "posts.title",
    ]);
    expect(userPosts1).toEqual({
      handle: USERS[1].handle,
      title: POSTS[2].title,
    });
  });

  it("subselects one from a multi-table query, filtered", async () => {
    const postTableLens = new TableLens(db, "posts", {
      returnColumns: ["id"],
    });
    const userReturns = await userTableLens.insert(USERS);
    const post0 = Object.assign({}, POSTS[0], { userId: userReturns[0].id });
    const post1 = Object.assign({}, POSTS[1], { userId: userReturns[1].id });
    const post2 = Object.assign({}, POSTS[2], { userId: userReturns[1].id });
    const postReturns = await postTableLens.insert([post0, post1, post2]);

    const joinedLens = new QueryLens(
      db,
      db
        .selectFrom("users")
        .innerJoin("posts", "users.id", "posts.userId")
        .orderBy("title", "desc")
    );

    // test filtering on table column
    const userPost1 = await joinedLens.subselectOne(
      {
        handle: USERS[1].handle,
      },
      ["handle", "posts.title as t"]
    );
    expect(userPost1).toEqual({ handle: USERS[1].handle, t: POSTS[2].title });

    // test filtering on joined column
    const userPost2 = await joinedLens.subselectOne(
      {
        "posts.title": POSTS[0].title,
      },
      ["handle"]
    );
    expect(userPost2).toEqual({ handle: USERS[0].handle });

    // test filtering on joined generated column
    const userPost3 = await joinedLens.subselectOne(
      {
        "posts.id": postReturns[0].id,
      },
      ["title"]
    );
    expect(userPost3).toEqual({ title: POSTS[0].title });
  });

  it("subselects one from a pre-selected multi-table query", async () => {
    const postTableLens = new TableLens(db, "posts", {
      returnColumns: ["id"],
    });
    const userReturns = await userTableLens.insert(USERS);
    const post0 = Object.assign({}, POSTS[0], { userId: userReturns[0].id });
    const post1 = Object.assign({}, POSTS[1], { userId: userReturns[1].id });
    const post2 = Object.assign({}, POSTS[2], { userId: userReturns[1].id });
    const postReturns = await postTableLens.insert([post0, post1, post2]);

    const joinedLens = new QueryLens(
      db,
      db
        .selectFrom("users")
        .innerJoin("posts", "users.id", "posts.userId")
        .select(["posts.id as postId", "posts.title", "users.handle"])
        .orderBy("title", "desc")
    );

    // test returning all columns
    const userPost1 = await joinedLens.subselectOne({}, []);
    expect(userPost1).toEqual({
      handle: USERS[1].handle,
      postId: postReturns[2].id,
      title: POSTS[2].title,
    });

    // test returning specific columns
    const userPost2 = await joinedLens.subselectOne({}, [
      "handle",
      "posts.id as postId",
    ]);
    expect(userPost2).toEqual({
      postId: postReturns[2].id,
      handle: USERS[1].handle,
    });

    ignore("detects type errors", async () => {
      // prettier-ignore
      (await joinedLens.subselectOne(
        { "posts.userId": userReturns[1].id }, []
        // @ts-expect-error - columns not originally selected are not accessible
      ))!.name;

      // prettier-ignore
      (await joinedLens.subselectOne(
        { "posts.userId": userReturns[1].id }, ["handle"]
        // @ts-expect-error - columns not originally selected are not accessible
      ))!.title;
    });
  });

  ignore("detects subselectOne() type errors", async () => {
    // @ts-expect-error - doesn't allow plain string expression filters
    userQueryLens.subselectOne("name = 'John Doe'", []);
    // @ts-expect-error - doesn't allow only two arguments of a binary op
    userQueryLens.subselectOne(["name", "="], []);
    // @ts-expect-error - object filter fields must be valid
    userQueryLens.subselectOne({ notThere: "xyz" }, []);
    // @ts-expect-error - binary op filter fields must be valid
    userQueryLens.subselectOne(["notThere", "=", "foo"], []);
    // @ts-expect-error - binary op filter fields must be valid
    userQueryLens.subselectOne(["users.notThere", "=", "foo"], []);
    // @ts-expect-error - only valid return columns are allowed
    userQueryLens.subselectOne({}, ["notThere"]);
    // @ts-expect-error - only valid return columns are allowed
    userQueryLens.subselectOne({}, ["users.notThere"]);
    // @ts-expect-error - only table columns are accessible
    (await userQueryLens.subselectOne({}, []))?.notThere;
    // @ts-expect-error - only returned columns are accessible
    (await userQueryLens.subselectOne({}, ["id"]))?.name;
    // @ts-expect-error - only table columns are accessible w/ object filter
    (await userQueryLens.subselectOne({ name: "Sue" }, []))?.notThere;
    await userQueryLens.subselectOne(
      ({ or, cmpr }) =>
        // @ts-expect-error - only table columns are accessible via anyOf()
        or([cmpr("notThere", "=", "xyz"), cmpr("alsoNotThere", "=", "Sue")]),
      []
    );
    await userQueryLens.subselectOne(
      ({ and, cmpr }) =>
        // @ts-expect-error - only table columns are accessible via allOf()
        and([cmpr("notThere", "=", "xyz"), cmpr("alsoNotThere", "=", "Sue")]),
      []
    );
  });
});
