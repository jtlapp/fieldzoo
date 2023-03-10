import { Kysely, sql } from "kysely";

// TODO: look at simplifying instances of facet creation with inferencing
// TODO: look at thoroughly testing filters in a filter-only test file

import { KyselyFacet } from "..";
import { createDB, resetDB, destroyDB } from "./utils/test-setup";
import { Database } from "./utils/test-tables";
import { StdUserFacetReturningID } from "./utils/test-facets";
import {
  selectedUser1,
  selectedUser2,
  selectedUser3,
  userRow1,
  userRow2,
  userRow3,
  USERS,
} from "./utils/test-objects";
import { ignore } from "@fieldzoo/testing-utils";
import { SelectedUser } from "./utils/test-types";

let db: Kysely<Database>;
let plainUserFacet: KyselyFacet<Database, "users">;
let stdUserFacet: StdUserFacetReturningID;

beforeAll(async () => {
  db = await createDB();
  plainUserFacet = new KyselyFacet(db, "users");
  stdUserFacet = new StdUserFacetReturningID(db);
});
beforeEach(() => resetDB(db));
afterAll(() => destroyDB(db));

describe("selectMany()", () => {
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

  it("selects with a MatchAllFilter", async () => {
    const allOf = stdUserFacet.selectFilterMaker().allOf;
    const userIDs = await stdUserFacet.insertReturning(USERS);

    const users = await plainUserFacet.selectMany(
      allOf({ name: USERS[0].name }, ["id", ">", userIDs[0].id])
    );
    expect(users.length).toEqual(1);
    expect(users[0].handle).toEqual(USERS[2].handle);
  });

  it("selects with a MatchAnyFilter", async () => {
    const anyOf = stdUserFacet.selectFilterMaker().anyOf;
    await stdUserFacet.insert(USERS);

    const users = await plainUserFacet.selectMany(
      anyOf({ handle: USERS[0].handle }, ["handle", "=", USERS[2].handle])
    );
    expect(users.length).toEqual(2);
    expect(users[0].handle).toEqual(USERS[0].handle);
    expect(users[1].handle).toEqual(USERS[2].handle);
  });

  it("selects with a MatchAnyFilter with a nested MatchAllFilter", async () => {
    const allOf = stdUserFacet.selectFilterMaker().allOf;
    const anyOf = stdUserFacet.selectFilterMaker().anyOf;
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

  ignore("detects selectMany() type errors", async () => {
    const allOf = stdUserFacet.selectFilterMaker().allOf;
    const anyOf = stdUserFacet.selectFilterMaker().anyOf;

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

  it("throws on unrecognized filter", async () => {
    expect(stdUserFacet.selectOne("" as any)).rejects.toThrow(
      "Unrecognized query filter"
    );
  });

  // TODO: Add tests for selectOne() with MatchAllFilter and MatchAllFilter filters

  ignore("detects selectOne() type errors", async () => {
    const allOf = stdUserFacet.selectFilterMaker().allOf;
    const anyOf = stdUserFacet.selectFilterMaker().anyOf;

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
  });
});

describe("selection transformation", () => {
  class SelectTransformFacet extends KyselyFacet<
    Database,
    "users",
    SelectedUser
  > {
    constructor(db: Kysely<Database>) {
      super(db, "users", {
        selectTransform: (source) =>
          SelectedUser.create(source.id, {
            firstName: source.name.split(" ")[0],
            lastName: source.name.split(" ")[1],
            handle: source.handle,
            email: source.email,
          }),
      });
    }
  }

  it("transforms the selection", async () => {
    const selectTransformFacet = new SelectTransformFacet(db);

    await stdUserFacet.insert(userRow1);
    const user = await selectTransformFacet.selectOne({});
    expect(user).toEqual(selectedUser1);

    await stdUserFacet.insert([userRow2, userRow3]);
    const users = await selectTransformFacet.selectMany((qb) =>
      qb.orderBy("id")
    );
    expect(users).toEqual([selectedUser1, selectedUser2, selectedUser3]);
  });

  ignore("detects selectTransform type errors", async () => {
    const selectTransformFacet = new SelectTransformFacet(db);

    // @ts-expect-error - only returns transformed selection
    (await selectTransformFacet.selectOne({})).name;
  });
});
