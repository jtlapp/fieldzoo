/**
 * Tests KyselyFacet.selectMany(), KyselyFacet.selectOne(), and query filters.
 */

import { Kysely, Selectable } from "kysely";

import { KyselyFacet } from "..";
import { createDB, resetDB, destroyDB } from "./utils/test-setup";
import { Database, Users } from "./utils/test-tables";
import { StdUserFacetReturningID } from "./utils/test-facets";
import { USERS } from "./utils/test-objects";
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
