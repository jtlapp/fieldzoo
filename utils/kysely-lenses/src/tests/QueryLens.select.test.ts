/**
 * Tests QueryLens.selectMany(), QueryLens.selectOne(), and query filters.
 */

import { Kysely, Selectable, sql } from "kysely";

import { QueryLens } from "../lenses/QueryLens";
import { TableLens } from "../lenses/TableLens";
import { createDB, resetDB, destroyDB } from "./utils/test-setup";
import { Database, Users } from "./utils/test-tables";
import { UserTableLensReturningID } from "./utils/test-lenses";
import { POSTS, USERS } from "./utils/test-objects";
import { ignore } from "./utils/test-utils";
import { QueryModifier } from "../lib/query-filter";
// import "kysely-params";

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

// TODO: delete this when I'm ready
//
// it("parameterizes a query", async () => {
//   await userTableLens.insert(USERS);
//
//   const parameterization = userQueryLens
//     .selectAllQB()
//     .parameterize<{ targetName: string }>(({ qb, param }) =>
//       qb.where("name", "=", param("targetName"))
//     );
//   const users = (
//     await parameterization.execute(db, {
//       targetName: USERS[0].name,
//     })
//   ).rows;
//   expect(users.length).toEqual(2);
//   expect(users[0].handle).toEqual(USERS[0].handle);
//   expect(users[1].handle).toEqual(USERS[2].handle);
// });

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

  const readUser1 = await userQueryLens
    .selectAllQB()
    .where("id", "=", user1.id)
    .executeTakeFirst();
  expect(readUser1?.handle).toEqual(USERS[1].handle);
  expect(readUser1?.email).toEqual(USERS[1].email);
});

describe("selectMany() with simple filters", () => {
  it("selects nothing when nothing matches filter", async () => {
    await userTableLens.insert(USERS);

    const users = await userQueryLens.selectMany({ name: "Not There" });
    expect(users.length).toEqual(0);
  });

  it("selects all rows with no filter", async () => {
    await userTableLens.insert(USERS);

    // Test selecting all
    const users = await userQueryLens.selectMany({});
    expect(users.length).toEqual(USERS.length);
    for (let i = 0; i < USERS.length; i++) {
      expect(users[i].handle).toEqual(USERS[i].handle);
    }
  });

  it("selects with a matching field filter", async () => {
    await userTableLens.insert(USERS);

    let users = await userQueryLens.selectMany({
      name: USERS[0].name,
    });
    expect(users.length).toEqual(2);
    expect(users[0].handle).toEqual(USERS[0].handle);
    expect(users[1].handle).toEqual(USERS[2].handle);

    users = await userQueryLens.selectMany({
      name: USERS[0].name,
      handle: USERS[2].handle,
    });
    expect(users.length).toEqual(1);
    expect(users[0].handle).toEqual(USERS[2].handle);
  });

  it("selects with a binary operation filter", async () => {
    await userTableLens.insert(USERS);

    // Test selecting by condition (with results)
    let users = await userQueryLens.selectMany(["name", "=", USERS[0].name]);
    expect(users.length).toEqual(2);
    expect(users[0].handle).toEqual(USERS[0].handle);
    expect(users[1].handle).toEqual(USERS[2].handle);

    // Test selecting by condition (no results)
    users = await userQueryLens.selectMany(["name", "=", "nonexistent"]);
    expect(users.length).toEqual(0);
  });

  it("selects with a query builder filter", async () => {
    await userTableLens.insert(USERS);

    const users = await userQueryLens.selectMany(
      new QueryModifier((qb) =>
        qb.where("name", "=", USERS[0].name).orderBy("handle", "desc")
      )
    );
    expect(users.length).toEqual(2);
    expect(users[0].handle).toEqual(USERS[2].handle);
    expect(users[1].handle).toEqual(USERS[0].handle);
  });

  it("selects with a query expression filter", async () => {
    await userTableLens.insert(USERS);

    const users = await userQueryLens.selectMany(sql`name != ${USERS[0].name}`);
    expect(users.length).toEqual(1);
    expect(users[0].handle).toEqual(USERS[1].handle);
  });

  it("selects many using a pre-configured aliased column", async () => {
    const ids = await userTableLens.insert(USERS);
    const lens = new QueryLens(db, db.selectFrom("users"), {
      columnAliases: ["handle as h"],
    });

    const users = await lens.selectMany({ name: USERS[0].name });
    expect(users).toEqual([
      Object.assign({}, USERS[0], { id: ids[0].id, h: USERS[0].handle }),
      Object.assign({}, USERS[2], { id: ids[2].id, h: USERS[2].handle }),
    ]);
  });

  it("selects many from a multi-table query, unfiltered", async () => {
    const postTableLens = new TableLens(db, "posts", {
      returnColumns: ["id"],
    });
    const insertReturns = await userTableLens.insert(USERS);
    const post0 = Object.assign({}, POSTS[0], { userId: insertReturns[0].id });
    const post1 = Object.assign({}, POSTS[1], { userId: insertReturns[1].id });
    const post2 = Object.assign({}, POSTS[2], { userId: insertReturns[1].id });
    const postReturns = await postTableLens.insert([post0, post1, post2]);

    const joinedLens = new QueryLens(
      db,
      db
        .selectFrom("users")
        .innerJoin("posts", "users.id", "posts.userId")
        .orderBy("title")
    );

    const userPosts: any[] = await joinedLens.selectMany({});
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
    const userPosts1: any[] = await joinedLens.selectMany({
      handle: USERS[1].handle,
    });
    for (const userPost of userPosts1) {
      delete userPost.createdAt;
    }
    expect(userPosts1).toEqual(user1Posts);

    // test filtering on a joined column
    const userPosts2: any[] = await joinedLens.selectMany({
      "posts.userId": userReturns[1].id,
    });
    for (const userPost of userPosts2) {
      delete userPost.createdAt;
    }
    expect(userPosts2).toEqual(user1Posts);
  });

  it("selects many from a pre-selected multi-table query", async () => {
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
    const userPosts1 = await joinedLens.selectMany({
      "posts.userId": userReturns[1].id,
    });
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

    ignore("detects type errors", async () => {
      // prettier-ignore
      (await joinedLens.selectMany(
        { "posts.userId": userReturns[1].id }
        // @ts-expect-error - columns not originally selected are not accessible
      ))[0].name;

      // prettier-ignore
      (await joinedLens.selectMany(
        { "posts.userId": userReturns[1].id }
        // @ts-expect-error - columns not originally selected are not accessible
      ))[0].userId;
    });
  });

  ignore("detects selectMany() simple filter type errors", async () => {
    // @ts-expect-error - doesn't allow plain string expressions
    userQueryLens.selectMany("name = 'John Doe'");
    // @ts-expect-error - doesn't allow only two arguments
    userQueryLens.selectMany("name", "=");
    // @ts-expect-error - object filter fields must be valid
    userQueryLens.selectMany({ notThere: "xyz" });
    userQueryLens.selectMany(({ or, cmpr }) =>
      // @ts-expect-error - where expression columns must be valid
      or([cmpr("notThere", "=", "Sue")])
    );
    // @ts-expect-error - binary op filter fields must be valid
    userQueryLens.selectMany(["notThere", "=", "foo"]);
    // @ts-expect-error - binary op filter fields must be valid
    userQueryLens.selectMany(["users.notThere", "=", "foo"]);
    // @ts-expect-error - only table columns are accessible unfiltered
    (await userQueryLens.selectMany({}))[0].notThere;
    // @ts-expect-error - only table columns are accessible w/ object filter
    (await userQueryLens.selectMany({ name: "Sue" }))[0].notThere;
    // @ts-expect-error - only table columns are accessible w/ op filter
    (await userQueryLens.selectMany(["name", "=", "Sue"]))[0].notThere;
    // @ts-expect-error - only table columns are accessible w/ QB filter
    (await userQueryLens.selectMany((qb) => qb))[0].notThere;
    // @ts-expect-error - only table columns are accessible w/ expr filter
    (await userQueryLens.selectMany(sql`name = 'Sue'`))[0].notThere;
  });
});

describe("selectOne()", () => {
  it("selects the first row with no filter", async () => {
    await userTableLens.insert(USERS);

    const user = await userQueryLens.selectOne({});
    expect(user?.handle).toEqual(USERS[0].handle);
  });

  it("selects the first row with a matching field filter", async () => {
    await userTableLens.insert(USERS);

    let user = await userQueryLens.selectOne({ name: USERS[0].name });
    expect(user?.handle).toEqual(USERS[0].handle);

    user = await userQueryLens.selectOne({
      name: USERS[0].name,
      handle: USERS[2].handle,
    });
    expect(user?.handle).toEqual(USERS[2].handle);
  });

  it("selects the first row with a binary operation filter", async () => {
    await userTableLens.insert(USERS);

    // Test selecting by condition (with result)
    let user = await userQueryLens.selectOne(["name", "=", USERS[0].name]);
    expect(user?.handle).toEqual(USERS[0].handle);

    // Test selecting by condition (no result)
    user = await userQueryLens.selectOne(["name", "=", "nonexistent"]);
    expect(user).toBeNull();
  });

  it("selects the first row with a query builder filter", async () => {
    await userTableLens.insert(USERS);

    const user = await userQueryLens.selectOne(
      new QueryModifier((qb) =>
        qb.where("name", "=", USERS[0].name).orderBy("handle", "desc")
      )
    );
    expect(user?.handle).toEqual(USERS[2].handle);
  });

  it("selects the first row with a query expression filter", async () => {
    await userTableLens.insert(USERS);

    const user = await userQueryLens.selectOne(sql`name != ${USERS[0].name}`);
    expect(user?.handle).toEqual(USERS[1].handle);
  });

  it("selects the first row with a compound filter", async () => {
    const userIDs = await userTableLens.insert(USERS);

    const user = await userQueryLens.selectOne(({ and, cmpr }) =>
      and([cmpr("name", "=", USERS[0].name), cmpr("id", ">", userIDs[0].id)])
    );
    expect(user?.handle).toEqual(USERS[2].handle);
  });

  it("selects one using a pre-configured aliased column", async () => {
    const ids = await userTableLens.insert(USERS);
    const lens = new QueryLens(db, db.selectFrom("users"), {
      columnAliases: ["handle as h"],
    });

    const user = await lens.selectOne({ handle: USERS[0].handle });
    expect(user).toEqual(
      Object.assign({}, USERS[0], { id: ids[0].id, h: USERS[0].handle })
    );
  });

  it("selects one from a multi-table query, unfiltered", async () => {
    const postTableLens = new TableLens(db, "posts", {
      returnColumns: ["id"],
    });
    const insertReturns = await userTableLens.insert(USERS);
    const post0 = Object.assign({}, POSTS[0], { userId: insertReturns[0].id });
    const post1 = Object.assign({}, POSTS[1], { userId: insertReturns[1].id });
    const post2 = Object.assign({}, POSTS[2], { userId: insertReturns[1].id });
    const postReturns = await postTableLens.insert([post0, post1, post2]);

    const joinedLens = new QueryLens(
      db,
      db
        .selectFrom("users")
        .innerJoin("posts", "users.id", "posts.userId")
        .orderBy("title", "desc")
    );

    const userPost: any = await joinedLens.selectOne({});
    delete userPost.createdAt;

    expect(userPost).toEqual(
      Object.assign({}, USERS[1], POSTS[2], {
        id: postReturns[2].id,
        userId: insertReturns[1].id,
      })
    );
  });

  it("selects one from a multi-table query, filtered", async () => {
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
        .orderBy("title")
    );

    // test filtering on a table column
    const userPost: any = await joinedLens.selectOne({
      handle: USERS[1].handle,
    });
    delete userPost.createdAt;
    expect(userPost).toEqual(
      Object.assign({}, USERS[1], POSTS[1], {
        id: postReturns[1].id,
        userId: userReturns[1].id,
      })
    );

    // test filtering on a joined column
    const userPost3: any = await joinedLens.subselectOne({
      "posts.id": postReturns[0].id,
    });
    delete userPost3.createdAt;
    expect(userPost3).toEqual(
      Object.assign({}, USERS[0], POSTS[0], {
        id: postReturns[0].id,
        userId: userReturns[0].id,
      })
    );
  });

  it("selects one from a pre-selected multi-table query", async () => {
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
    const userPosts1 = await joinedLens.selectOne({
      "posts.userId": userReturns[1].id,
    });
    expect(userPosts1).toEqual({
      postId: postReturns[2].id,
      title: POSTS[2].title,
      handle: USERS[1].handle,
    });

    ignore("detects type errors", async () => {
      // prettier-ignore
      (await joinedLens.selectOne(
        { "posts.userId": userReturns[1].id }
        // @ts-expect-error - columns not originally selected are not accessible
      ))!.name;

      // prettier-ignore
      (await joinedLens.selectOne(
        { "posts.userId": userReturns[1].id }
        // @ts-expect-error - columns not originally selected are not accessible
      ))!.userId;
    });
  });

  ignore("detects selectOne() type errors", async () => {
    // @ts-expect-error - doesn't allow plain string expression filters
    userQueryLens.selectOne("name = 'John Doe'");
    // @ts-expect-error - doesn't allow only two arguments of a binary op
    userQueryLens.selectOne(["name", "="]);
    // @ts-expect-error - object filter fields must be valid
    userQueryLens.selectOne({ notThere: "xyz" });
    userQueryLens.selectOne(({ or, cmpr }) =>
      // @ts-expect-error - where expression columns must be valid
      or([cmpr("notThere", "=", "Sue")])
    );
    // @ts-expect-error - binary op filter fields must be valid
    userQueryLens.selectOne(["notThere", "=", "foo"]);
    // @ts-expect-error - binary op filter fields must be valid
    userQueryLens.selectOne(["users.notThere", "=", "foo"]);
    // @ts-expect-error - only table columns are accessible unfiltered
    (await userQueryLens.selectOne({})).notThere;
    // @ts-expect-error - only table columns are accessible w/ object filter
    (await userQueryLens.selectOne({ name: "Sue" })).notThere;
    // @ts-expect-error - only table columns are accessible w/ op filter
    (await userQueryLens.selectOne(["name", "=", "Sue"])).notThere;
    // @ts-expect-error - only table columns are accessible w/ QB filter
    (await userQueryLens.selectOne((qb) => qb)).notThere;
    // @ts-expect-error - only table columns are accessible w/ expr filter
    (await userQueryLens.selectOne(sql`name = 'Sue'`)).notThere;
  });
});
