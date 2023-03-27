import { Insertable, Kysely, Selectable, sql } from "kysely";

import { TableFacet } from "../facets/TableFacet";
import { allOf, anyOf } from "../filters/CompoundFilter";
import { createDB, resetDB, destroyDB } from "./utils/test-setup";
import { Database } from "./utils/test-tables";
import {
  UserTableFacetReturningDefault,
  UserTableFacetReturningID,
  UserTableFacetReturningIDAndHandle,
  UserTableFacetReturningAll,
  UserTableFacetReturningNothing,
} from "./utils/test-facets";
import {
  userObject1,
  userRow1,
  userRow2,
  userRow3,
  USERS,
} from "./utils/test-objects";
import { ignore } from "./utils/test-utils";
import { ReturnedUser, UpdaterUser } from "./utils/test-types";

let db: Kysely<Database>;
let userFacetReturningDefault: UserTableFacetReturningDefault;
let userFacetReturningNothing: UserTableFacetReturningNothing;
let userFacetReturningID: UserTableFacetReturningID;
let userFacetReturningIDAndHandle: UserTableFacetReturningIDAndHandle;
let userFacetReturningAll: UserTableFacetReturningAll;

beforeAll(async () => {
  db = await createDB();
  userFacetReturningDefault = new UserTableFacetReturningDefault(db);
  userFacetReturningNothing = new UserTableFacetReturningNothing(db);
  userFacetReturningID = new UserTableFacetReturningID(db);
  userFacetReturningIDAndHandle = new UserTableFacetReturningIDAndHandle(db);
  userFacetReturningAll = new UserTableFacetReturningAll(db);
});
beforeEach(() => resetDB(db));
afterAll(() => destroyDB(db));

it("updateQB() allows for updating rows", async () => {
  const user1 = await userFacetReturningID.insert(USERS[1]);
  const updater = { email: "new@baz.com" };

  await userFacetReturningAll
    .updateQB()
    .set(updater)
    .where("id", "=", user1.id)
    .execute();

  const readUser1 = await userFacetReturningAll.selectOne({ id: user1.id });
  expect(readUser1?.handle).toEqual(USERS[1].handle);
  expect(readUser1?.email).toEqual(updater.email);
});

describe("updating rows via TableFacet", () => {
  it("updates returning zero update count", async () => {
    const updateValues = { email: "new.email@xyz.pdq" };
    const updateCount = await userFacetReturningAll.updateGetCount(
      { id: 1 },
      updateValues
    );
    expect(updateCount).toEqual(0);

    const updates = await userFacetReturningID.update({ id: 1 }, updateValues);
    expect(updates.length).toEqual(0);
  });

  it("updates returning non-zero update count", async () => {
    const updateValues = { email: "new.email@xyz.pdq" };
    const insertReturn0 = await userFacetReturningID.insert(USERS[0]);
    await userFacetReturningID.insert(USERS[1]);
    await userFacetReturningID.insert(USERS[2]);

    const updateCount1 = await userFacetReturningAll.updateGetCount(
      { id: insertReturn0.id },
      updateValues
    );
    expect(updateCount1).toEqual(1);

    const readUser = await userFacetReturningID.selectOne([
      "id",
      "=",
      insertReturn0.id,
    ]);
    expect(readUser?.email).toEqual(updateValues.email);

    const updateCount2 = await userFacetReturningAll.updateGetCount(
      { name: "Sue" },
      updateValues
    );
    expect(updateCount2).toEqual(2);

    const readUsers = await userFacetReturningID.selectMany([
      "name",
      "=",
      "Sue",
    ]);
    expect(readUsers.length).toEqual(2);
    expect(readUsers[0].email).toEqual(updateValues.email);
    expect(readUsers[1].email).toEqual(updateValues.email);

    // prettier-ignore
    const updateCount = await userFacetReturningID.updateGetCount({}, {
      name: "Every User",
    });
    expect(updateCount).toEqual(3);
  });

  it("updates returning configured return columns", async () => {
    await userFacetReturningID.insert(USERS[0]);
    const insertReturn = await userFacetReturningID.insert(USERS[1]);
    await userFacetReturningID.insert(USERS[2]);

    // Verify that update performs the correct change on the correct row.
    const updateValues1 = { email: "new.email@xyz.pdq" };
    const updateReturns1 = await userFacetReturningID.update(
      { id: insertReturn.id },
      updateValues1
    );
    expect(updateReturns1).toEqual([{ id: insertReturn.id }]);
    let readUser = await userFacetReturningID.selectOne([
      "id",
      "=",
      insertReturn.id,
    ]);
    expect(readUser?.email).toEqual(updateValues1.email);

    // Verify a different change on the same row, returning multiple columns.
    const updateValues2 = { name: "Sue" };
    const updateReturns2 = await userFacetReturningIDAndHandle.update(
      { email: updateValues1.email },
      updateValues2
    );
    expect(updateReturns2).toEqual([
      {
        id: insertReturn.id,
        handle: USERS[1].handle,
      },
    ]);
    readUser = await userFacetReturningID.selectOne([
      "id",
      "=",
      insertReturn.id,
    ]);
    expect(readUser?.name).toEqual(updateValues2.name);

    // Verify that update changes all required rows.
    const updateValues3 = { name: "Replacement Sue" };
    const updateReturns3 = await userFacetReturningIDAndHandle.update(
      { name: "Sue" },
      updateValues3
    );
    expect(updateReturns3.length).toEqual(3);
    expect(updateReturns3[0].handle).toEqual(USERS[0].handle);
    expect(updateReturns3[1].handle).toEqual(USERS[1].handle);
    expect(updateReturns3[2].handle).toEqual(USERS[2].handle);
    const readUsers = await userFacetReturningID.selectMany([
      "name",
      "=",
      updateValues3.name,
    ]);
    expect(readUsers.length).toEqual(3);
  });

  it("update returns void when defaulting to no return columns", async () => {
    await userFacetReturningID.insert(USERS);

    const updates = await userFacetReturningDefault.update(
      { name: "Sue" },
      { email: "new.email@xyz.pdq" }
    );
    expect(updates).toBeUndefined();

    const readUsers = await userFacetReturningID.selectMany({
      email: "new.email@xyz.pdq",
    });
    expect(readUsers.length).toEqual(2);
  });

  it("update returns void when explicitly no return columns", async () => {
    await userFacetReturningID.insert(USERS);

    const updates = await userFacetReturningNothing.update(
      { name: "Sue" },
      { email: "new.email@xyz.pdq" }
    );
    expect(updates).toBeUndefined();

    const readUsers = await userFacetReturningID.selectMany({
      email: "new.email@xyz.pdq",
    });
    expect(readUsers.length).toEqual(2);
  });

  it("updates configured to return all columns", async () => {
    const insertReturns = await userFacetReturningID.insert(USERS);

    const updateValues = { email: "new.email@xyz.pdq" };
    const updateReturns = await userFacetReturningAll.update(
      { name: "Sue" },
      updateValues
    );

    const expectedUsers = [
      Object.assign({}, USERS[0], updateValues, { id: insertReturns[0].id }),
      Object.assign({}, USERS[2], updateValues, { id: insertReturns[2].id }),
    ];
    expect(updateReturns).toEqual(expectedUsers);
  });

  it("updates all rows when no filter is given", async () => {
    const insertReturns = await userFacetReturningID.insert(USERS);

    const updateValues = { email: "new.email@xyz.pdq" };
    const updateReturns = await userFacetReturningIDAndHandle.update(
      {},
      updateValues
    );

    const expectedUsers = USERS.map((user, i) => {
      return { id: insertReturns[i].id, handle: user.handle };
    });
    expect(updateReturns).toEqual(expectedUsers);

    const readUsers = await userFacetReturningID.selectMany({});
    expect(readUsers.length).toEqual(3);
    for (const user of readUsers) {
      expect(user.email).toEqual(updateValues.email);
    }
  });

  it("updates rows indicated by a binary operator", async () => {
    const insertReturns = await userFacetReturningID.insert(USERS);

    const updateValues = { email: "new.email@xyz.pdq" };
    const updateCount = await userFacetReturningAll.updateGetCount(
      ["id", ">", insertReturns[0].id],
      updateValues
    );
    expect(updateCount).toEqual(2);

    const readUsers = await userFacetReturningID.selectMany([
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
    const insertReturns = await userFacetReturningID.insert(USERS);

    const updateValues = { email: "new.email@xyz.pdq" };
    const updateCount = await userFacetReturningDefault.updateGetCount(
      sql`id > ${insertReturns[0].id}`,
      updateValues
    );
    expect(updateCount).toEqual(2);

    const readUsers = await userFacetReturningID.selectMany([
      "id",
      ">",
      insertReturns[0].id,
    ]);
    expect(readUsers.length).toEqual(2);
    for (const user of readUsers) {
      expect(user.email).toEqual(updateValues.email);
    }
  });

  it("updates rows indicated by anyOf() filter", async () => {
    const insertReturns = await userFacetReturningID.insert(USERS);

    const updateValues1 = { email: "foo@xyz.pdq" };
    const updateCount = await userFacetReturningAll.updateGetCount(
      anyOf(["id", "=", insertReturns[0].id], ["id", "=", insertReturns[2].id]),
      updateValues1
    );
    expect(updateCount).toEqual(2);

    const updateValues2 = { email: "bar@xyz.pdq" };
    const updateReturns = await userFacetReturningID.update(
      anyOf(["id", "=", insertReturns[0].id], ["id", "=", insertReturns[2].id]),
      updateValues2
    );
    expect(updateReturns).toEqual([
      { id: insertReturns[0].id },
      { id: insertReturns[2].id },
    ]);
  });

  it("updates rows indicated by allOf() filter", async () => {
    const insertReturns = await userFacetReturningID.insert(USERS);

    const updateValues1 = { email: "foo@xyz.pdq" };
    const updateCount = await userFacetReturningDefault.updateGetCount(
      allOf(["id", "=", insertReturns[0].id], ["name", "=", "Sue"]),
      updateValues1
    );
    expect(updateCount).toEqual(1);

    const updateValues2 = { email: "bar@xyz.pdq" };
    const updateReturns = await userFacetReturningID.update(
      allOf(["id", "=", insertReturns[0].id], ["name", "=", "Sue"]),
      updateValues2
    );
    expect(updateReturns).toEqual([{ id: insertReturns[0].id }]);
  });

  ignore("detects update() and update() type errors", async () => {
    userFacetReturningID.updateGetCount(
      // @ts-expect-error - table must have all filter fields
      { notThere: "xyz" },
      { email: "abc@def.ghi" }
    );
    userFacetReturningID.update(
      // @ts-expect-error - table must have all filter fields
      { notThere: "xyz" },
      { email: "abc@def.ghi" }
    );
    // @ts-expect-error - table must have all filter fields
    userFacetReturningID.update(["notThere", "=", "foo"], {
      email: "abc@def.ghi",
    });
    // @ts-expect-error - table must have all filter fields
    userFacetReturningID.update(["notThere", "=", "foo"], {
      email: "abc@def.ghi",
    });
    // @ts-expect-error - update must only have table columns
    userFacetReturningID.update({ id: 32 }, { notThere: "xyz@pdq.xyz" });
    userFacetReturningID.update(
      { id: 32 },
      // @ts-expect-error - update must only have table columns
      { notThere: "xyz@pdq.xyz" }
    );
    // @ts-expect-error - doesn't allow plain string expression filters
    userFacetReturningID.update("name = 'John Doe'", USERS[0]);
    // @ts-expect-error - doesn't allow plain string expression filters
    userFacetReturningID.update("name = 'John Doe'", USERS[0]);
    // @ts-expect-error - only requested columns are accessible
    (await userFacetReturningID.update({ id: 32 }, USERS[0]))[0].name;
    // @ts-expect-error - only requested columns are accessible
    // prettier-ignore
    (await userFacetReturningID.update({ id: 32 }, USERS[0]))[0].name;
    await userFacetReturningID.updateGetCount(
      // @ts-expect-error - only table columns are accessible via anyOf()
      anyOf({ notThere: "xyz" }, ["alsoNotThere", "=", "Sue"]),
      USERS[0]
    );
    await userFacetReturningID.update(
      // @ts-expect-error - only table columns are accessible via anyOf()
      anyOf({ notThere: "xyz" }, ["alsoNotThere", "=", "Sue"]),
      USERS[0]
    );
    await userFacetReturningID.updateGetCount(
      // @ts-expect-error - only table columns are accessible via allOf()
      allOf({ notThere: "xyz" }, ["alsoNotThere", "=", "Sue"]),
      USERS[0]
    );
    await userFacetReturningID.update(
      // @ts-expect-error - only table columns are accessible via allOf()
      allOf({ notThere: "xyz" }, ["alsoNotThere", "=", "Sue"]),
      USERS[0]
    );
  });
});

describe("update transformation", () => {
  class UpdateTransformFacet extends TableFacet<
    Database,
    "users",
    Selectable<Database["users"]>,
    Insertable<Database["users"]>,
    UpdaterUser,
    ["id"]
  > {
    constructor(db: Kysely<Database>) {
      super(db, "users", {
        updaterTransform: (source) => ({
          name: `${source.firstName} ${source.lastName}`,
          handle: source.handle,
          email: source.email,
        }),
        returnColumns: ["id"],
      });
    }
  }

  it("transforms users for update without transforming return", async () => {
    const facet = new UpdateTransformFacet(db);

    const insertReturns = await facet.insert([userRow1, userRow2, userRow3]);
    const updaterUser1 = UpdaterUser.create(
      0,
      Object.assign({}, userObject1, { firstName: "Suzanne" })
    );

    const updateReturns = await facet.update(
      anyOf({ id: insertReturns[0].id }, { id: insertReturns[2].id }),
      updaterUser1
    );
    expect(updateReturns).toEqual([
      { id: insertReturns[0].id },
      { id: insertReturns[2].id },
    ]);

    const readUsers = await facet.selectMany((qb) => qb.orderBy("id"));
    expect(readUsers).toEqual([
      Object.assign({}, userRow1, {
        id: insertReturns[0].id,
        name: "Suzanne Smith",
      }),
      Object.assign({}, userRow2, { id: insertReturns[1].id }),
      Object.assign({}, userRow1, {
        id: insertReturns[2].id,
        name: "Suzanne Smith",
      }),
    ]);
  });

  it("transforms update return without transforming update", async () => {
    class UpdateReturnTransformFacet extends TableFacet<
      Database,
      "users",
      Selectable<Database["users"]>,
      Insertable<Database["users"]>,
      Partial<Insertable<Database["users"]>>,
      ["id"],
      ReturnedUser
    > {
      constructor(db: Kysely<Database>) {
        super(db, "users", {
          returnColumns: ["id"],
          updateReturnTransform: (source, returns) =>
            new ReturnedUser(
              returns.id,
              source.name ? source.name.split(" ")[0] : "(first)",
              source.name ? source.name.split(" ")[1] : "(last)",
              source.handle ? source.handle : "(handle)",
              source.email ? source.email : "(email)"
            ),
        });
      }
    }
    const updateReturnTransformFacet = new UpdateReturnTransformFacet(db);

    const insertReturn = await updateReturnTransformFacet.insert(userRow1);
    const updateReturn = await updateReturnTransformFacet.update(
      { id: insertReturn.id },
      { name: "Suzanne Smith" }
    );
    expect(updateReturn).toEqual([
      new ReturnedUser(
        insertReturn.id,
        "Suzanne",
        "Smith",
        "(handle)",
        "(email)"
      ),
    ]);
  });

  it("transforms update and update return", async () => {
    class UpdateAndReturnTransformFacet extends TableFacet<
      Database,
      "users",
      Selectable<Database["users"]>,
      Insertable<Database["users"]>,
      UpdaterUser,
      ["id"],
      ReturnedUser
    > {
      constructor(db: Kysely<Database>) {
        super(db, "users", {
          updaterTransform: (source) => ({
            name: `${source.firstName} ${source.lastName}`,
            handle: source.handle,
            email: source.email,
          }),
          returnColumns: ["id"],
          updateReturnTransform: (source, returns) =>
            new ReturnedUser(
              returns.id,
              source.firstName,
              source.lastName,
              source.handle,
              source.email
            ),
        });
      }
    }
    const updateAndReturnTransformFacet = new UpdateAndReturnTransformFacet(db);

    const insertReturn = await updateAndReturnTransformFacet.insert(userRow1);
    const updateReturn = await updateAndReturnTransformFacet.update(
      { id: insertReturn.id },
      UpdaterUser.create(0, userObject1)
    );
    expect(updateReturn).toEqual([
      new ReturnedUser(
        insertReturn.id,
        userObject1.firstName,
        userObject1.lastName,
        userObject1.handle,
        userObject1.email
      ),
    ]);
  });
});
