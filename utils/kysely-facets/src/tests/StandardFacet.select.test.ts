import { Kysely, sql } from "kysely";

import { createDB, resetDB, destroyDB } from "./utils/test-setup";
import { Database, UserTable } from "./utils/test-tables";
import { USERS } from "./utils/test-objects";
import { ignore } from "@fieldzoo/testing-utils";
import { allOf, anyOf } from "../filters/ComboFilter";

let db: Kysely<Database>;
let userTable: UserTable;

beforeAll(async () => {
  db = await createDB();
  userTable = new UserTable(db);
});
beforeEach(() => resetDB(db));
afterAll(() => destroyDB(db));

describe("selectMany()", () => {
  it("selects all rows with no filter", async () => {
    await userTable.insertMany(USERS);

    // Test selecting all
    const users = await userTable.selectMany({});
    expect(users.length).toEqual(USERS.length);
    for (let i = 0; i < USERS.length; i++) {
      expect(users[i].handle).toEqual(USERS[i].handle);
    }
  });

  it("selects with a matching field filter", async () => {
    await userTable.insertMany(USERS);

    let users = await userTable.selectMany({ name: USERS[0].name });
    expect(users.length).toEqual(2);
    expect(users[0].handle).toEqual(USERS[0].handle);
    expect(users[1].handle).toEqual(USERS[2].handle);

    users = await userTable.selectMany({
      name: USERS[0].name,
      handle: USERS[2].handle,
    });
    expect(users.length).toEqual(1);
    expect(users[0].handle).toEqual(USERS[2].handle);
  });

  it("selects with a binary operation filter", async () => {
    await userTable.insertMany(USERS);

    // Test selecting by condition (with results)
    let users = await userTable.selectMany(["name", "=", USERS[0].name]);
    expect(users.length).toEqual(2);
    expect(users[0].handle).toEqual(USERS[0].handle);
    expect(users[1].handle).toEqual(USERS[2].handle);

    // Test selecting by condition (no results)
    users = await userTable.selectMany(["name", "=", "nonexistent"]);
    expect(users.length).toEqual(0);
  });

  it("selects with a query builder filter", async () => {
    await userTable.insertMany(USERS);

    const users = await userTable.selectMany((qb) =>
      qb.where("name", "=", USERS[0].name).orderBy("handle", "desc")
    );
    expect(users.length).toEqual(2);
    expect(users[0].handle).toEqual(USERS[2].handle);
    expect(users[1].handle).toEqual(USERS[0].handle);
  });

  it("selects with a query expression filter", async () => {
    await userTable.insertMany(USERS);

    const users = await userTable.selectMany(sql`name != ${USERS[0].name}`);
    expect(users.length).toEqual(1);
    expect(users[0].handle).toEqual(USERS[1].handle);
  });

  it("selects with an MatchAllFilter filter", async () => {
    const userIDs = await userTable.insertMany(USERS, ["id"]);

    const users = await userTable.selectMany(
      allOf({ name: USERS[0].name }, ["id", ">", userIDs[0].id])
    );
    expect(users.length).toEqual(1);
    expect(users[0].handle).toEqual(USERS[2].handle);
  });

  it("selects with an MatchAnyFilter filter", async () => {
    await userTable.insertMany(USERS, ["id"]);

    const users = await userTable.selectMany(
      anyOf({ handle: USERS[0].handle }, ["handle", "=", USERS[2].handle])
    );
    expect(users.length).toEqual(2);
    expect(users[0].handle).toEqual(USERS[0].handle);
    expect(users[1].handle).toEqual(USERS[2].handle);
  });

  it("selects with an MatchAnyFilter with a nested MatchAllFilter filter", async () => {
    const userIDs = await userTable.insertMany(USERS, ["id"]);

    const users = await userTable.selectMany(
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
    // @ts-expect-error - doesn't allow plain string expressions
    userTable.selectMany("name = 'John Doe'");
    // @ts-expect-error - doesn't allow only two arguments
    userTable.selectMany("name", "=");
    // @ts-expect-error - object filter fields must be valid
    userTable.selectMany({ notThere: "xyz" });
    // @ts-expect-error - binary op filter fields must be valid
    userTable.selectMany(["notThere", "=", "foo"]);
    // @ts-expect-error - only table columns are accessible unfiltered
    (await userTable.selectMany({}))[0].notThere;
    // @ts-expect-error - only table columns are accessible w/ object filter
    (await userTable.selectMany({ name: "Sue" }))[0].notThere;
    // @ts-expect-error - only table columns are accessible w/ op filter
    (await userTable.selectMany(["name", "=", "Sue"]))[0].notThere;
    // @ts-expect-error - only table columns are accessible w/ QB filter
    (await userTable.selectMany((qb) => qb))[0].notThere;
    // @ts-expect-error - only table columns are accessible w/ expr filter
    (await userTable.selectMany(sql`name = 'Sue'`))[0].notThere;
  });
});

describe("selectOne()", () => {
  it("selects the first row with no filter", async () => {
    await userTable.insertMany(USERS);

    const user = await userTable.selectOne({});
    expect(user?.handle).toEqual(USERS[0].handle);
  });

  it("selects the first row with a matching field filter", async () => {
    await userTable.insertMany(USERS);

    let user = await userTable.selectOne({ name: USERS[0].name });
    expect(user?.handle).toEqual(USERS[0].handle);

    user = await userTable.selectOne({
      name: USERS[0].name,
      handle: USERS[2].handle,
    });
    expect(user?.handle).toEqual(USERS[2].handle);
  });

  it("selects the first row with a binary operation filter", async () => {
    await userTable.insertMany(USERS);

    // Test selecting by condition (with result)
    let user = await userTable.selectOne(["name", "=", USERS[0].name]);
    expect(user?.handle).toEqual(USERS[0].handle);

    // Test selecting by condition (no result)
    user = await userTable.selectOne(["name", "=", "nonexistent"]);
    expect(user).toBeNull();
  });

  it("selects the first row with a query builder filter", async () => {
    await userTable.insertMany(USERS);

    const user = await userTable.selectOne((qb) =>
      qb.where("name", "=", USERS[0].name).orderBy("handle", "desc")
    );
    expect(user?.handle).toEqual(USERS[2].handle);
  });

  it("selects the first row with a query expression filter", async () => {
    await userTable.insertMany(USERS);

    const user = await userTable.selectOne(sql`name != ${USERS[0].name}`);
    expect(user?.handle).toEqual(USERS[1].handle);
  });

  it("throws on unrecognized filter", async () => {
    expect(userTable.selectOne("" as any)).rejects.toThrow(
      "Unrecognized query filter"
    );
  });

  // TODO: Add tests for selectOne() with MatchAllFilter and MatchAllFilter filters

  ignore("detects selectOne() type errors", async () => {
    // @ts-expect-error - doesn't allow plain string expression filters
    userTable.selectOne("name = 'John Doe'");
    // @ts-expect-error - doesn't allow only two arguments of a binary op
    userTable.selectOne(["name", "="]);
    // @ts-expect-error - object filter fields must be valid
    userTable.selectOne({ notThere: "xyz" });
    // @ts-expect-error - binary op filter fields must be valid
    userTable.selectOne(["notThere", "=", "foo"]);
    // @ts-expect-error - only table columns are accessible unfiltered
    (await userTable.selectOne({})).notThere;
    // @ts-expect-error - only table columns are accessible w/ object filter
    (await userTable.selectOne({ name: "Sue" })).notThere;
    // @ts-expect-error - only table columns are accessible w/ op filter
    (await userTable.selectOne(["name", "=", "Sue"])).notThere;
    // @ts-expect-error - only table columns are accessible w/ QB filter
    (await userTable.selectOne((qb) => qb)).notThere;
    // @ts-expect-error - only table columns are accessible w/ expr filter
    (await userTable.selectOne(sql`name = 'Sue'`)).notThere;
  });
});
