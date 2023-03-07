import { Kysely, sql } from "kysely";

import { createDB, resetDB, destroyDB } from "./utils/test-setup";
import { Database } from "./utils/test-tables";
import { UserFacet } from "./utils/test-facets";
import { USERS } from "./utils/test-objects";
import { ignore } from "@fieldzoo/testing-utils";

let db: Kysely<Database>;
let userFacet: UserFacet;

beforeAll(async () => {
  db = await createDB();
  userFacet = new UserFacet(db);
});
beforeEach(() => resetDB(db));
afterAll(() => destroyDB(db));

describe("update()", () => {
  it("updates without returning", async () => {
    const insertedUser = await userFacet.insertOne(USERS[0], ["id"]);
    const updateValues = { email: "new.email@xyz.pdq" };

    const result = await userFacet.update(
      { id: insertedUser.id },
      updateValues
    );
    expect(result).toBeUndefined();

    const readUser = await userFacet.selectOne(["id", "=", insertedUser.id]);
    expect(readUser?.email).toEqual(updateValues.email);
  });

  it("updates returning update count", async () => {
    const insertedUser0 = await userFacet.insertOne(USERS[0], ["id"]);
    await userFacet.insertOne(USERS[1]);
    await userFacet.insertOne(USERS[2]);

    const updateValues = { email: "new.email@xyz.pdq" };
    const updateCount1 = await userFacet.update(
      { id: insertedUser0.id },
      updateValues,
      []
    );
    expect(updateCount1).toEqual(1);

    const readUser = await userFacet.selectOne(["id", "=", insertedUser0.id]);
    expect(readUser?.email).toEqual(updateValues.email);

    const updateCount2 = await userFacet.update(
      { name: "Sue" },
      updateValues,
      []
    );
    expect(updateCount2).toEqual(2);

    const readUsers = await userFacet.selectMany(["name", "=", "Sue"]);
    expect(readUsers.length).toEqual(2);
    expect(readUsers[0].email).toEqual(updateValues.email);
    expect(readUsers[1].email).toEqual(updateValues.email);
  });

  it("updates returning indicated columns", async () => {
    await userFacet.insertOne(USERS[0]);
    const insertedUser = await userFacet.insertOne(USERS[1], ["id"]);
    await userFacet.insertOne(USERS[2]);

    // Verify that update performs the correct change on the correct row.
    const updateValues1 = { email: "new.email@xyz.pdq" };
    const updatedUsers1 = await userFacet.update(
      { id: insertedUser.id },
      updateValues1,
      ["name"]
    );
    expect(updatedUsers1).toEqual([{ name: USERS[1].name }]);
    let readUser = await userFacet.selectOne(["id", "=", insertedUser.id]);
    expect(readUser?.email).toEqual(updateValues1.email);

    // Verify a different change on the same row, returning multiple columns.
    const updateValues2 = { name: "Sue" };
    const updatedUsers2 = await userFacet.update(
      { email: updateValues1.email },
      updateValues2,
      ["id", "handle"]
    );
    expect(updatedUsers2).toEqual([
      {
        id: insertedUser.id,
        handle: USERS[1].handle,
      },
    ]);
    readUser = await userFacet.selectOne(["id", "=", insertedUser.id]);
    expect(readUser?.name).toEqual(updateValues2.name);

    // Verify that update changes all required rows.
    const updateValues3 = { name: "Replacement Sue" };
    const updatedUsers3 = await userFacet.update(
      { name: "Sue" },
      updateValues3,
      ["handle"]
    );
    expect(updatedUsers3).toEqual([
      { handle: USERS[0].handle },
      { handle: USERS[1].handle },
      { handle: USERS[2].handle },
    ]);
    const readUsers = await userFacet.selectMany([
      "name",
      "=",
      updateValues3.name,
    ]);
    expect(readUsers.length).toEqual(3);
  });

  it("updates returning all columns", async () => {
    const insertedUsers = await userFacet.insertMany(USERS, ["id"]);

    const updateValues = { email: "new.email@xyz.pdq" };
    const updatedUsers = await userFacet.update({ name: "Sue" }, updateValues, [
      "*",
    ]);

    const expectedUsers = [
      Object.assign({}, USERS[0], updateValues, { id: insertedUsers[0].id }),
      Object.assign({}, USERS[2], updateValues, { id: insertedUsers[2].id }),
    ];
    expect(updatedUsers).toEqual(expectedUsers);

    const readUsers = await userFacet.selectMany(["name", "=", "Sue"]);
    expect(readUsers).toEqual(expectedUsers);
  });

  it("updates all rows when no filter is given", async () => {
    await userFacet.insertMany(USERS, ["id"]);

    const updateValues = { email: "new.email@xyz.pdq" };
    const updatedUsers = await userFacet.update({}, updateValues, ["handle"]);

    const expectedUsers = USERS.map((user) => {
      return { handle: user.handle };
    });
    expect(updatedUsers).toEqual(expectedUsers);

    const readUsers = await userFacet.selectMany({});
    expect(readUsers.length).toEqual(3);
    for (const user of readUsers) {
      expect(user.email).toEqual(updateValues.email);
    }
  });

  it("updates rows indicated by a binary operator", async () => {
    const insertedUsers = await userFacet.insertMany(USERS, ["id"]);

    const updateValues = { email: "new.email@xyz.pdq" };
    const updateCount = await userFacet.update(
      ["id", ">", insertedUsers[0].id],
      updateValues,
      []
    );
    expect(updateCount).toEqual(2);

    const readUsers = await userFacet.selectMany([
      "id",
      ">",
      insertedUsers[0].id,
    ]);
    expect(readUsers.length).toEqual(2);
    for (const user of readUsers) {
      expect(user.email).toEqual(updateValues.email);
    }
  });

  it("updates rows indicated by a kysely expression", async () => {
    const insertedUsers = await userFacet.insertMany(USERS, ["id"]);

    const updateValues = { email: "new.email.@xyz.pdq" };
    const updateCount = await userFacet.update(
      sql`id > ${insertedUsers[0].id}`,
      updateValues,
      []
    );
    expect(updateCount).toEqual(2);

    const readUsers = await userFacet.selectMany([
      "id",
      ">",
      insertedUsers[0].id,
    ]);
    expect(readUsers.length).toEqual(2);
    for (const user of readUsers) {
      expect(user.email).toEqual(updateValues.email);
    }
  });

  // TODO: Add update() tests for MatchAllFilter and MatchAllFilter queries.

  ignore("detects update() type errors", async () => {
    // @ts-expect-error - table must have all filter fields
    userFacet.update({ notThere: "xyz" }, { email: "abc@def.ghi" });
    // @ts-expect-error - table must have all filter fields
    userFacet.update(["notThere", "=", "foo"], { email: "abc@def.ghi" });
    // @ts-expect-error - update must only have table columns
    userFacet.update({ id: 32 }, { notThere: "xyz@pdq.xyz" });
    // @ts-expect-error - returning argument can't be a string
    userFacet.update({ id: 32 }, USERS[0], "id");
    // @ts-expect-error - returning argument can't be a string
    userFacet.update({ id: 32 }, USERS[0], "*");
    // @ts-expect-error - returning arguments must be valid column names
    userFacet.update({ id: 32 }, USERS[0], [""]);
    // @ts-expect-error - returning arguments must be valid column names
    userFacet.update({ id: 32 }, USERS[0], ["notThere"]);
    // @ts-expect-error - returning arguments must be valid column names
    userFacet.update({ id: 32 }, USERS[0], ["notThere", "*"]);
    // @ts-expect-error - doesn't allow plain string expression filters
    userFacet.update("name = 'John Doe'", USERS[0]);
    // @ts-expect-error - only requested columns are accessible
    (await userFacet.update({ id: 32 }, USERS[0], ["id"]))[0].name;
  });
});