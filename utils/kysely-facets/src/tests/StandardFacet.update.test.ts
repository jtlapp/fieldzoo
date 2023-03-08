import { Kysely, sql } from "kysely";

import { StandardFacet } from "..";
import { createDB, resetDB, destroyDB } from "./utils/test-setup";
import { Database } from "./utils/test-tables";
import { StdUserFacetReturningID } from "./utils/test-facets";
import { USERS } from "./utils/test-objects";
import { ignore } from "@fieldzoo/testing-utils";

let db: Kysely<Database>;
let stdUserFacet: StdUserFacetReturningID;

beforeAll(async () => {
  db = await createDB();
  stdUserFacet = new StdUserFacetReturningID(db);
});
beforeEach(() => resetDB(db));
afterAll(() => destroyDB(db));

describe("update()", () => {
  it("updates without returning", async () => {
    const insertReturn = await stdUserFacet.insertOne(USERS[0]);
    const updateValues = { email: "new.email@xyz.pdq" };

    const result = await stdUserFacet.update(
      { id: insertReturn.id },
      updateValues
    );
    expect(result).toBeUndefined();

    const readUser = await stdUserFacet.selectOne(["id", "=", insertReturn.id]);
    expect(readUser?.email).toEqual(updateValues.email);
  });

  it("updates returning update count", async () => {
    const insertReturn0 = await stdUserFacet.insertOne(USERS[0]);
    await stdUserFacet.insertOne(USERS[1]);
    await stdUserFacet.insertOne(USERS[2]);

    const updateValues = { email: "new.email@xyz.pdq" };
    const updateCount1 = await stdUserFacet.update(
      { id: insertReturn0.id },
      updateValues,
      []
    );
    expect(updateCount1).toEqual(1);

    const readUser = await stdUserFacet.selectOne([
      "id",
      "=",
      insertReturn0.id,
    ]);
    expect(readUser?.email).toEqual(updateValues.email);

    const updateCount2 = await stdUserFacet.update(
      { name: "Sue" },
      updateValues,
      []
    );
    expect(updateCount2).toEqual(2);

    const readUsers = await stdUserFacet.selectMany(["name", "=", "Sue"]);
    expect(readUsers.length).toEqual(2);
    expect(readUsers[0].email).toEqual(updateValues.email);
    expect(readUsers[1].email).toEqual(updateValues.email);
  });

  it("updates returning indicated columns", async () => {
    await stdUserFacet.insertOne(USERS[0]);
    const insertReturn = await stdUserFacet.insertOne(USERS[1]);
    await stdUserFacet.insertOne(USERS[2]);

    // Verify that update performs the correct change on the correct row.
    const updateValues1 = { email: "new.email@xyz.pdq" };
    const updateReturns1 = await stdUserFacet.update(
      { id: insertReturn.id },
      updateValues1,
      ["name"]
    );
    expect(updateReturns1).toEqual([{ name: USERS[1].name }]);
    let readUser = await stdUserFacet.selectOne(["id", "=", insertReturn.id]);
    expect(readUser?.email).toEqual(updateValues1.email);

    // Verify a different change on the same row, returning multiple columns.
    const updateValues2 = { name: "Sue" };
    const updateReturns2 = await stdUserFacet.update(
      { email: updateValues1.email },
      updateValues2,
      ["id", "handle"]
    );
    expect(updateReturns2).toEqual([
      {
        id: insertReturn.id,
        handle: USERS[1].handle,
      },
    ]);
    readUser = await stdUserFacet.selectOne(["id", "=", insertReturn.id]);
    expect(readUser?.name).toEqual(updateValues2.name);

    // Verify that update changes all required rows.
    const updateValues3 = { name: "Replacement Sue" };
    const updateReturns3 = await stdUserFacet.update(
      { name: "Sue" },
      updateValues3,
      ["handle"]
    );
    expect(updateReturns3).toEqual([
      { handle: USERS[0].handle },
      { handle: USERS[1].handle },
      { handle: USERS[2].handle },
    ]);
    const readUsers = await stdUserFacet.selectMany([
      "name",
      "=",
      updateValues3.name,
    ]);
    expect(readUsers.length).toEqual(3);
  });

  it("updates returning all columns", async () => {
    const insertReturns = await stdUserFacet.insertMany(USERS);

    const updateValues = { email: "new.email@xyz.pdq" };
    const updateReturns = await stdUserFacet.update(
      { name: "Sue" },
      updateValues,
      ["*"]
    );

    const expectedUsers = [
      Object.assign({}, USERS[0], updateValues, { id: insertReturns[0].id }),
      Object.assign({}, USERS[2], updateValues, { id: insertReturns[2].id }),
    ];
    expect(updateReturns).toEqual(expectedUsers);

    const readUsers = await stdUserFacet.selectMany(["name", "=", "Sue"]);
    expect(readUsers).toEqual(expectedUsers);
  });

  it("updates all rows when no filter is given", async () => {
    await stdUserFacet.insertMany(USERS);

    const updateValues = { email: "new.email@xyz.pdq" };
    const updateReturns = await stdUserFacet.update({}, updateValues, [
      "handle",
    ]);

    const expectedUsers = USERS.map((user) => {
      return { handle: user.handle };
    });
    expect(updateReturns).toEqual(expectedUsers);

    const readUsers = await stdUserFacet.selectMany({});
    expect(readUsers.length).toEqual(3);
    for (const user of readUsers) {
      expect(user.email).toEqual(updateValues.email);
    }
  });

  it("updates rows indicated by a binary operator", async () => {
    const insertReturns = await stdUserFacet.insertMany(USERS);

    const updateValues = { email: "new.email@xyz.pdq" };
    const updateCount = await stdUserFacet.update(
      ["id", ">", insertReturns[0].id],
      updateValues,
      []
    );
    expect(updateCount).toEqual(2);

    const readUsers = await stdUserFacet.selectMany([
      "id",
      ">",
      insertReturns[0].id,
    ]);
    expect(readUsers.length).toEqual(2);
    for (const user of readUsers) {
      expect(user.email).toEqual(updateValues.email);
    }
  });

  it("updates rows indicated by a kysely expression", async () => {
    const insertReturns = await stdUserFacet.insertMany(USERS);

    const updateValues = { email: "new.email.@xyz.pdq" };
    const updateCount = await stdUserFacet.update(
      sql`id > ${insertReturns[0].id}`,
      updateValues,
      []
    );
    expect(updateCount).toEqual(2);

    const readUsers = await stdUserFacet.selectMany([
      "id",
      ">",
      insertReturns[0].id,
    ]);
    expect(readUsers.length).toEqual(2);
    for (const user of readUsers) {
      expect(user.email).toEqual(updateValues.email);
    }
  });

  // TODO: Add update() tests for MatchAllFilter and MatchAllFilter queries.

  ignore("detects update() type errors", async () => {
    // @ts-expect-error - returns undefined without returning argument
    stdUserFacet.update({}, USERS[0]).email;
    // @ts-expect-error - table must have all filter fields
    stdUserFacet.update({ notThere: "xyz" }, { email: "abc@def.ghi" });
    // @ts-expect-error - table must have all filter fields
    stdUserFacet.update(["notThere", "=", "foo"], {
      email: "abc@def.ghi",
    });
    // @ts-expect-error - update must only have table columns
    stdUserFacet.update({ id: 32 }, { notThere: "xyz@pdq.xyz" });
    // @ts-expect-error - returning argument can't be a string
    stdUserFacet.update({ id: 32 }, USERS[0], "id");
    // @ts-expect-error - returning argument can't be a string
    stdUserFacet.update({ id: 32 }, USERS[0], "*");
    // @ts-expect-error - returning arguments must be valid column names
    stdUserFacet.update({ id: 32 }, USERS[0], [""]);
    // @ts-expect-error - returning arguments must be valid column names
    stdUserFacet.update({ id: 32 }, USERS[0], ["notThere"]);
    // @ts-expect-error - returning arguments must be valid column names
    stdUserFacet.update({ id: 32 }, USERS[0], ["notThere", "*"]);
    // @ts-expect-error - doesn't allow plain string expression filters
    stdUserFacet.update("name = 'John Doe'", USERS[0]);
    // @ts-expect-error - only requested columns are accessible
    (await stdUserFacet.update({ id: 32 }, USERS[0], ["id"]))[0].name;
  });
});

describe("update transformation", () => {
  // class UpdateTransformFacet extends StandardFacet<
  //   Database,
  //   "users",
  //   Selectable<Database["users"]>,
  //   Insertable<Database["users"]>,
  //   UpdatedUser
  // > {
  //   constructor(db: Kysely<Database>) {
  //     super(db, "users", {
  //       updateTransform: (source) => ({
  //         name: `${source.firstName} ${source.lastName}`,
  //         handle: source.handle,
  //         email: source.email,
  //       }),
  //     });
  //   }
  // }

  // it("transforms users for update without transforming return", async () => {
  //   const facet = new UpdateTransformFacet(db);

  //   const insertReturns = await facet.insertMany([userRow1, userRow2], ["id"]);
  //   // TODO
  // });

  it("errors when providing an empty defaultUpdateReturns array", () => {
    expect(
      () =>
        new StandardFacet(db, "users", {
          updateReturnTransform: (source, _returns) => source,
          defaultUpdateReturns: [],
        })
    ).toThrow("'defaultUpdateReturns' cannot be an empty array");
  });

  it("errors when providing only one of updateReturnTransform and defaultUpdateReturns", () => {
    expect(
      () =>
        new StandardFacet(db, "users", {
          updateReturnTransform: (source, _returns) => source,
        })
    ).toThrow("'updateReturnTransform' requires 'defaultUpdateReturns'");
    expect(
      () =>
        new StandardFacet(db, "users", {
          defaultUpdateReturns: ["id"],
        })
    ).toThrow("'defaultUpdateReturns' requires 'updateReturnTransform'");
  });
});
