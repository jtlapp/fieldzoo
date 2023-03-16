/**
 * Tests KyselyFacet.selectMany(), KyselyFacet.selectOne(), and query filters.
 */

import { Kysely, Selectable, sql } from "kysely";

import { KyselyFacet, StandardFacet } from "..";
import { createDB, resetDB, destroyDB } from "./utils/test-setup";
import { Database, Users } from "./utils/test-tables";
import { StdUserFacetReturningID } from "./utils/test-facets";
import { POSTS, USERS } from "./utils/test-objects";
import { ignore } from "@fieldzoo/testing-utils";
import { allOf, anyOf } from "../filters/CompoundFilter";

let db: Kysely<Database>;
let plainUserFacet: KyselyFacet<Database, "users", Partial<Selectable<Users>>>;
let stdUserFacet: StdUserFacetReturningID;

beforeAll(async () => {
  db = await createDB();
  plainUserFacet = new KyselyFacet(db, db.selectFrom("users"));
  stdUserFacet = new StdUserFacetReturningID(db);
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

  const readUser1 = await plainUserFacet
    .selectAllQB()
    .where("id", "=", user1.id)
    .executeTakeFirst();
  expect(readUser1?.handle).toEqual(USERS[1].handle);
  expect(readUser1?.email).toEqual(USERS[1].email);
});

describe("selectMany() with simple filters", () => {
  it("selects nothing when nothing matches filter", async () => {
    await stdUserFacet.insert(USERS);

    const users = await plainUserFacet.selectMany({ name: "Not There" });
    expect(users.length).toEqual(0);
  });

  it("selects all rows with no filter", async () => {
    await stdUserFacet.insert(USERS);

    // Test selecting all
    const users = await plainUserFacet.selectMany({});
    expect(users.length).toEqual(USERS.length);
    for (let i = 0; i < USERS.length; i++) {
      expect(users[i].handle).toEqual(USERS[i].handle);
    }
  });

  it("selects with a matching field filter", async () => {
    await stdUserFacet.insert(USERS);

    let users = await plainUserFacet.selectMany({
      name: USERS[0].name,
    });
    expect(users.length).toEqual(2);
    expect(users[0].handle).toEqual(USERS[0].handle);
    expect(users[1].handle).toEqual(USERS[2].handle);

    users = await plainUserFacet.selectMany({
      name: USERS[0].name,
      handle: USERS[2].handle,
    });
    expect(users.length).toEqual(1);
    expect(users[0].handle).toEqual(USERS[2].handle);
  });

  it("selects with a binary operation filter", async () => {
    await stdUserFacet.insert(USERS);

    // Test selecting by condition (with results)
    let users = await plainUserFacet.selectMany(["name", "=", USERS[0].name]);
    expect(users.length).toEqual(2);
    expect(users[0].handle).toEqual(USERS[0].handle);
    expect(users[1].handle).toEqual(USERS[2].handle);

    // Test selecting by condition (no results)
    users = await plainUserFacet.selectMany(["name", "=", "nonexistent"]);
    expect(users.length).toEqual(0);
  });

  it("selects with a query builder filter", async () => {
    await stdUserFacet.insert(USERS);

    const users = await plainUserFacet.selectMany((qb) =>
      qb.where("name", "=", USERS[0].name).orderBy("handle", "desc")
    );
    expect(users.length).toEqual(2);
    expect(users[0].handle).toEqual(USERS[2].handle);
    expect(users[1].handle).toEqual(USERS[0].handle);
  });

  it("selects with a query expression filter", async () => {
    await stdUserFacet.insert(USERS);

    const users = await plainUserFacet.selectMany(
      sql`name != ${USERS[0].name}`
    );
    expect(users.length).toEqual(1);
    expect(users[0].handle).toEqual(USERS[1].handle);
  });

  it("throws on unrecognized filter", async () => {
    expect(stdUserFacet.selectMany("" as any)).rejects.toThrow(
      "Unrecognized query filter"
    );
  });

  ignore("detects selectMany() simple filter type errors", async () => {
    // @ts-expect-error - doesn't allow plain string expressions
    plainUserFacet.selectMany("name = 'John Doe'");
    // @ts-expect-error - doesn't allow only two arguments
    plainUserFacet.selectMany("name", "=");
    // @ts-expect-error - object filter fields must be valid
    plainUserFacet.selectMany({ notThere: "xyz" });
    // @ts-expect-error - binary op filter fields must be valid
    plainUserFacet.selectMany(["notThere", "=", "foo"]);
    // @ts-expect-error - only table columns are accessible unfiltered
    (await plainUserFacet.selectMany({}))[0].notThere;
    // @ts-expect-error - only table columns are accessible w/ object filter
    (await plainUserFacet.selectMany({ name: "Sue" }))[0].notThere;
    // @ts-expect-error - only table columns are accessible w/ op filter
    (await plainUserFacet.selectMany(["name", "=", "Sue"]))[0].notThere;
    // @ts-expect-error - only table columns are accessible w/ QB filter
    (await plainUserFacet.selectMany((qb) => qb))[0].notThere;
    // @ts-expect-error - only table columns are accessible w/ expr filter
    (await plainUserFacet.selectMany(sql`name = 'Sue'`))[0].notThere;
  });
});

describe("selectMany() with compound filters", () => {
  it("selects with allOf()", async () => {
    //const allOf = stdUserFacet.selectFilterMaker().allOf;
    const userIDs = await stdUserFacet.insertReturning(USERS);

    const users = await plainUserFacet.selectMany(
      allOf({ name: USERS[0].name }, ["id", ">", userIDs[0].id])
    );
    expect(users.length).toEqual(1);
    expect(users[0].handle).toEqual(USERS[2].handle);
  });

  it("selects with anyOf()", async () => {
    await stdUserFacet.insert(USERS);

    const users = await plainUserFacet.selectMany(
      anyOf({ handle: USERS[0].handle }, ["handle", "=", USERS[2].handle])
    );
    expect(users.length).toEqual(2);
    expect(users[0].handle).toEqual(USERS[0].handle);
    expect(users[1].handle).toEqual(USERS[2].handle);
  });

  it("selects with anyOf() and a nested allOf()", async () => {
    const userIDs = await stdUserFacet.insertReturning(USERS);

    const users = await plainUserFacet.selectMany(
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

  it("selects from a multi-table query", async () => {
    const stdPostFacet = new StandardFacet(db, "posts");
    const insertReturns = await stdUserFacet.insertReturning(USERS);
    const post0 = Object.assign({}, POSTS[0], { userId: insertReturns[0].id });
    const post1 = Object.assign({}, POSTS[1], { userId: insertReturns[1].id });
    const post2 = Object.assign({}, POSTS[2], { userId: insertReturns[1].id });
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

  ignore("detects selectMany() compound filter type errors", async () => {
    await plainUserFacet.selectMany(
      // @ts-expect-error - only table columns are accessible via anyOf()
      anyOf({ notThere: "xyz" }, ["alsoNotThere", "=", "Sue"])
    );
    await plainUserFacet.selectMany(
      // @ts-expect-error - only table columns are accessible via allOf()
      allOf({ notThere: "xyz" }, ["alsoNotThere", "=", "Sue"])
    );
    await plainUserFacet.selectMany(
      // @ts-expect-error - only table columns are accessible via anyOf()
      anyOf({ name: "xyz" }, allOf(["notThere", "=", "Sue"]))
    );
    await plainUserFacet.selectMany(
      // @ts-expect-error - only table columns are accessible via anyOf()
      allOf({ name: "xyz" }, anyOf(["notThere", "=", "Sue"]))
    );
  });
});

describe("selectOne()", () => {
  it("selects the first row with no filter", async () => {
    await stdUserFacet.insert(USERS);

    const user = await plainUserFacet.selectOne({});
    expect(user?.handle).toEqual(USERS[0].handle);
  });

  it("selects the first row with a matching field filter", async () => {
    await stdUserFacet.insert(USERS);

    let user = await plainUserFacet.selectOne({ name: USERS[0].name });
    expect(user?.handle).toEqual(USERS[0].handle);

    user = await plainUserFacet.selectOne({
      name: USERS[0].name,
      handle: USERS[2].handle,
    });
    expect(user?.handle).toEqual(USERS[2].handle);
  });

  it("selects the first row with a binary operation filter", async () => {
    await stdUserFacet.insert(USERS);

    // Test selecting by condition (with result)
    let user = await plainUserFacet.selectOne(["name", "=", USERS[0].name]);
    expect(user?.handle).toEqual(USERS[0].handle);

    // Test selecting by condition (no result)
    user = await plainUserFacet.selectOne(["name", "=", "nonexistent"]);
    expect(user).toBeNull();
  });

  it("selects the first row with a query builder filter", async () => {
    await stdUserFacet.insert(USERS);

    const user = await plainUserFacet.selectOne((qb) =>
      qb.where("name", "=", USERS[0].name).orderBy("handle", "desc")
    );
    expect(user?.handle).toEqual(USERS[2].handle);
  });

  it("selects the first row with a query expression filter", async () => {
    await stdUserFacet.insert(USERS);

    const user = await plainUserFacet.selectOne(sql`name != ${USERS[0].name}`);
    expect(user?.handle).toEqual(USERS[1].handle);
  });

  it("selects the first row with a compound filter", async () => {
    const userIDs = await stdUserFacet.insertReturning(USERS);

    const user = await plainUserFacet.selectOne(
      allOf({ name: USERS[0].name }, ["id", ">", userIDs[0].id])
    );
    expect(user?.handle).toEqual(USERS[2].handle);
  });

  it("throws on unrecognized filter", async () => {
    expect(stdUserFacet.selectOne("" as any)).rejects.toThrow(
      "Unrecognized query filter"
    );
  });

  it("selects from a multi-table query", async () => {
    const stdPostFacet = new StandardFacet(db, "posts");
    const insertReturns = await stdUserFacet.insertReturning(USERS);
    const post0 = Object.assign({}, POSTS[0], { userId: insertReturns[0].id });
    const post1 = Object.assign({}, POSTS[1], { userId: insertReturns[1].id });
    const post2 = Object.assign({}, POSTS[2], { userId: insertReturns[1].id });
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

    const userPost: any = await joinedFacet.selectOne({});
    delete userPost.createdAt;

    expect(userPost).toEqual(
      Object.assign({}, USERS[1], POSTS[2], {
        id: postReturns[2].id,
        userId: insertReturns[1].id,
      })
    );
  });

  ignore("detects selectOne() type errors", async () => {
    // @ts-expect-error - doesn't allow plain string expression filters
    plainUserFacet.selectOne("name = 'John Doe'");
    // @ts-expect-error - doesn't allow only two arguments of a binary op
    plainUserFacet.selectOne(["name", "="]);
    // @ts-expect-error - object filter fields must be valid
    plainUserFacet.selectOne({ notThere: "xyz" });
    // @ts-expect-error - binary op filter fields must be valid
    plainUserFacet.selectOne(["notThere", "=", "foo"]);
    // @ts-expect-error - only table columns are accessible unfiltered
    (await plainUserFacet.selectOne({})).notThere;
    // @ts-expect-error - only table columns are accessible w/ object filter
    (await plainUserFacet.selectOne({ name: "Sue" })).notThere;
    // @ts-expect-error - only table columns are accessible w/ op filter
    (await plainUserFacet.selectOne(["name", "=", "Sue"])).notThere;
    // @ts-expect-error - only table columns are accessible w/ QB filter
    (await plainUserFacet.selectOne((qb) => qb)).notThere;
    // @ts-expect-error - only table columns are accessible w/ expr filter
    (await plainUserFacet.selectOne(sql`name = 'Sue'`)).notThere;
    await plainUserFacet.selectOne(
      // @ts-expect-error - only table columns are accessible via anyOf()
      anyOf({ notThere: "xyz" }, ["alsoNotThere", "=", "Sue"])
    );
    await plainUserFacet.selectOne(
      // @ts-expect-error - only table columns are accessible via allOf()
      allOf({ notThere: "xyz" }, ["alsoNotThere", "=", "Sue"])
    );
    await plainUserFacet.selectOne(
      // @ts-expect-error - only table columns are accessible via anyOf()
      anyOf({ name: "xyz" }, allOf(["notThere", "=", "Sue"]))
    );
    await plainUserFacet.selectOne(
      // @ts-expect-error - only table columns are accessible via anyOf()
      allOf({ name: "xyz" }, anyOf(["notThere", "=", "Sue"]))
    );
  });
});
