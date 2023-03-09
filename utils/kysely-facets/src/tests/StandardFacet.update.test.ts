import { Kysely, sql } from "kysely";

import { StandardFacet } from "..";
import { createDB, resetDB, destroyDB } from "./utils/test-setup";
import { Database } from "./utils/test-tables";
import {
  StdUserFacet,
  StdUserFacetReturningID,
  StdUserFacetReturningIDAndHandle,
  StdUserFacetReturningAll,
} from "./utils/test-facets";
import { USERS } from "./utils/test-objects";
import { ignore } from "@fieldzoo/testing-utils";

let db: Kysely<Database>;
let stdUserFacet: StdUserFacet;
let stdUserFacetReturningID: StdUserFacetReturningID;
let stdUserFacetReturningIDAndHandle: StdUserFacetReturningIDAndHandle;
let stdUserFacetReturningAll: StdUserFacetReturningAll;

beforeAll(async () => {
  db = await createDB();
  stdUserFacet = new StdUserFacet(db);
  stdUserFacetReturningID = new StdUserFacetReturningID(db);
  stdUserFacetReturningIDAndHandle = new StdUserFacetReturningIDAndHandle(db);
  stdUserFacetReturningAll = new StdUserFacetReturningAll(db);
});
beforeEach(() => resetDB(db));
afterAll(() => destroyDB(db));

describe("update()", () => {
  it("updates returning update count", async () => {
    const insertReturn0 = await stdUserFacetReturningID.insertOne(USERS[0]);
    await stdUserFacetReturningID.insertOne(USERS[1]);
    await stdUserFacetReturningID.insertOne(USERS[2]);

    const updateValues = { email: "new.email@xyz.pdq" };
    const updateCount1 = await stdUserFacet.update(
      { id: insertReturn0.id },
      updateValues
    );
    expect(updateCount1).toEqual(1);

    const readUser = await stdUserFacetReturningID.selectOne([
      "id",
      "=",
      insertReturn0.id,
    ]);
    expect(readUser?.email).toEqual(updateValues.email);

    const updateCount2 = await stdUserFacet.update(
      { name: "Sue" },
      updateValues
    );
    expect(updateCount2).toEqual(2);

    const readUsers = await stdUserFacetReturningID.selectMany([
      "name",
      "=",
      "Sue",
    ]);
    expect(readUsers.length).toEqual(2);
    expect(readUsers[0].email).toEqual(updateValues.email);
    expect(readUsers[1].email).toEqual(updateValues.email);
  });

  it("updates returning configured return columns", async () => {
    await stdUserFacetReturningID.insertOne(USERS[0]);
    const insertReturn = await stdUserFacetReturningID.insertOne(USERS[1]);
    await stdUserFacetReturningID.insertOne(USERS[2]);

    // Verify that update performs the correct change on the correct row.
    const updateValues1 = { email: "new.email@xyz.pdq" };
    const updateReturns1 = await stdUserFacetReturningID.update(
      { id: insertReturn.id },
      updateValues1
    );
    expect(updateReturns1).toEqual([{ id: insertReturn.id }]);
    let readUser = await stdUserFacetReturningID.selectOne([
      "id",
      "=",
      insertReturn.id,
    ]);
    expect(readUser?.email).toEqual(updateValues1.email);

    // Verify a different change on the same row, returning multiple columns.
    const updateValues2 = { name: "Sue" };
    const updateReturns2 = await stdUserFacetReturningIDAndHandle.update(
      { email: updateValues1.email },
      updateValues2
    );
    expect(updateReturns2).toEqual([
      {
        id: insertReturn.id,
        handle: USERS[1].handle,
      },
    ]);
    readUser = await stdUserFacetReturningID.selectOne([
      "id",
      "=",
      insertReturn.id,
    ]);
    expect(readUser?.name).toEqual(updateValues2.name);

    // Verify that update changes all required rows.
    const updateValues3 = { name: "Replacement Sue" };
    const updateReturns3 = await stdUserFacetReturningIDAndHandle.update(
      { name: "Sue" },
      updateValues3
    );
    expect(updateReturns3.length).toEqual(3);
    expect(updateReturns3[0].handle).toEqual(USERS[0].handle);
    expect(updateReturns3[1].handle).toEqual(USERS[1].handle);
    expect(updateReturns3[2].handle).toEqual(USERS[2].handle);
    const readUsers = await stdUserFacetReturningID.selectMany([
      "name",
      "=",
      updateValues3.name,
    ]);
    expect(readUsers.length).toEqual(3);
  });

  it("updates configured to return all columns", async () => {
    const insertReturns = await stdUserFacetReturningID.insertMany(USERS);

    const updateValues = { email: "new.email@xyz.pdq" };
    const updateReturns = await stdUserFacetReturningAll.update(
      { name: "Sue" },
      updateValues
    );

    const expectedUsers = [
      Object.assign({}, USERS[0], updateValues, { id: insertReturns[0].id }),
      Object.assign({}, USERS[2], updateValues, { id: insertReturns[2].id }),
    ];
    expect(updateReturns).toEqual(expectedUsers);

    const readUsers = await stdUserFacetReturningID.selectMany([
      "name",
      "=",
      "Sue",
    ]);
    expect(readUsers).toEqual(expectedUsers);
  });

  it("updates all rows when no filter is given", async () => {
    const insertReturns = await stdUserFacetReturningID.insertMany(USERS);

    const updateValues = { email: "new.email@xyz.pdq" };
    const updateReturns = await stdUserFacetReturningIDAndHandle.update(
      {},
      updateValues
    );

    const expectedUsers = USERS.map((user, i) => {
      return { id: insertReturns[i].id, handle: user.handle };
    });
    expect(updateReturns).toEqual(expectedUsers);

    const readUsers = await stdUserFacetReturningID.selectMany({});
    expect(readUsers.length).toEqual(3);
    for (const user of readUsers) {
      expect(user.email).toEqual(updateValues.email);
    }
  });

  it("updates rows indicated by a binary operator", async () => {
    const insertReturns = await stdUserFacetReturningID.insertMany(USERS);

    const updateValues = { email: "new.email@xyz.pdq" };
    const updateCount = await stdUserFacet.update(
      ["id", ">", insertReturns[0].id],
      updateValues
    );
    expect(updateCount).toEqual(2);

    const readUsers = await stdUserFacetReturningID.selectMany([
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
    const insertReturns = await stdUserFacetReturningID.insertMany(USERS);

    const updateValues = { email: "new.email.@xyz.pdq" };
    const updateCount = await stdUserFacet.update(
      sql`id > ${insertReturns[0].id}`,
      updateValues
    );
    expect(updateCount).toEqual(2);

    const readUsers = await stdUserFacetReturningID.selectMany([
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
    stdUserFacetReturningID.update(
      // @ts-expect-error - table must have all filter fields
      { notThere: "xyz" },
      { email: "abc@def.ghi" }
    );
    // @ts-expect-error - table must have all filter fields
    stdUserFacetReturningID.update(["notThere", "=", "foo"], {
      email: "abc@def.ghi",
    });
    // @ts-expect-error - update must only have table columns
    stdUserFacetReturningID.update({ id: 32 }, { notThere: "xyz@pdq.xyz" });
    // @ts-expect-error - doesn't allow plain string expression filters
    stdUserFacetReturningID.update("name = 'John Doe'", USERS[0]);
    // @ts-expect-error - only requested columns are accessible
    (await stdUserFacetReturningID.update({ id: 32 }, USERS[0]))[0].name;
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
