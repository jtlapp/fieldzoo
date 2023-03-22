import { Kysely } from "kysely";

import { createDB, resetDB, destroyDB } from "./utils/test-setup";
import { Database } from "./utils/test-tables";
import { USERS, insertedUser1 } from "./utils/test-objects";
import { OrmObject, OrmTableFacet } from "../facets/OrmTableFacet";

let db: Kysely<Database>;

beforeAll(async () => {
  db = await createDB();
});
beforeEach(() => resetDB(db));
afterAll(() => destroyDB(db));

it("inserts/updates/deletes a mapped object w/ default transforms", async () => {
  class OrmUser implements OrmObject<number> {
    constructor(
      public id: number,
      public name: string,
      public handle: string,
      public email: string
    ) {}

    getId() {
      return this.id;
    }
  }

  const ormTableFacet = new OrmTableFacet<Database, "users", OrmUser>(
    db,
    "users",
    "id"
  );

  // test updating a non-existent user
  const userWithID = new OrmUser(
    1,
    USERS[0].name,
    USERS[0].handle,
    USERS[0].email
  );
  const updateReturn1 = await ormTableFacet.upsert(userWithID);
  expect(updateReturn1).toEqual(null);

  // test inserting a user
  const insertedUser = new OrmUser(
    0,
    USERS[0].name,
    USERS[0].handle,
    USERS[0].email
  );
  const insertReturn = (await ormTableFacet.upsert(insertedUser))!;
  expect(insertReturn).not.toBeNull();
  expect(insertReturn.id).toBeGreaterThan(0);

  // test getting a user by ID
  const selectedUser1 = await ormTableFacet.selectById(insertReturn.id);
  expect(selectedUser1).toEqual(insertReturn);
  expect(selectedUser1?.id).toEqual(insertReturn.id);

  // test updating a user
  const updaterUser = new OrmUser(
    selectedUser1!.id,
    "Xana",
    selectedUser1!.handle,
    selectedUser1!.email
  );
  const updateReturn = await ormTableFacet.upsert(updaterUser);
  expect(updateReturn).toEqual(updaterUser);
  const selectedUser2 = await ormTableFacet.selectById(insertReturn.id);
  expect(selectedUser2).toEqual(updateReturn);

  // test deleting a user
  const deleted = await ormTableFacet.deleteById(insertReturn.id);
  expect(deleted).toEqual(true);
  const selectedUser3 = await ormTableFacet.selectById(insertReturn.id);
  expect(selectedUser3).toEqual(null);

  // inserting user with a truthy ID should fail
  await expect(ormTableFacet.insert(userWithID)).rejects.toThrowError(
    "must be falsy"
  );
});

it("inserts/updates/deletes a mapped object class w/ custom transforms", async () => {
  class OrmUser implements OrmObject<number> {
    constructor(
      public serialNo: number,
      public firstName: string,
      public lastName: string,
      public handle: string,
      public email: string
    ) {}

    getId() {
      return this.serialNo;
    }
  }

  const insertTransform = (user: OrmUser) => {
    return {
      name: `${user.firstName} ${user.lastName}`,
      handle: user.handle,
      email: user.email,
    };
  };

  const ormTableFacet = new OrmTableFacet(db, "users", "id", {
    insertTransform,
    insertReturnTransform: (user, returns) => {
      return new OrmUser(
        returns.id,
        user.firstName,
        user.lastName,
        user.handle,
        user.email
      );
    },
    updaterTransform: insertTransform,
    updateReturnTransform: (user, _returns) => {
      return new OrmUser(
        user.serialNo,
        user.firstName,
        user.lastName,
        user.handle,
        user.email
      );
    },
    selectTransform: (row) => {
      const names = row.name.split(" ");
      return new OrmUser(row.id, names[0], names[1], row.handle, row.email);
    },
  });

  // test updating a non-existent user
  const updateReturn1 = await ormTableFacet.upsert(
    new OrmUser(
      1,
      insertedUser1.firstName,
      insertedUser1.lastName,
      insertedUser1.handle,
      insertedUser1.email
    )
  );
  expect(updateReturn1).toEqual(null);

  // test inserting a user
  const insertedUser = new OrmUser(
    0,
    insertedUser1.firstName,
    insertedUser1.lastName,
    insertedUser1.handle,
    insertedUser1.email
  );
  const insertReturn = (await ormTableFacet.upsert(insertedUser))!;
  expect(insertReturn).not.toBeNull();
  expect(insertReturn.serialNo).toBeGreaterThan(0);

  // test getting a user by ID
  const selectedUser1 = await ormTableFacet.selectById(insertReturn.serialNo);
  expect(selectedUser1).toEqual(insertReturn);
  expect(selectedUser1?.serialNo).toEqual(insertReturn.serialNo);

  // test updating a user
  const updaterUser = new OrmUser(
    selectedUser1!.serialNo,
    selectedUser1!.firstName,
    "Xana",
    selectedUser1!.handle,
    selectedUser1!.email
  );
  const updateReturn = await ormTableFacet.upsert(updaterUser);
  expect(updateReturn).toEqual(updaterUser);
  const selectedUser2 = await ormTableFacet.selectById(insertReturn.serialNo);
  expect(selectedUser2).toEqual(updateReturn);

  // test deleting a user
  const deleted = await ormTableFacet.deleteById(insertReturn.serialNo);
  expect(deleted).toEqual(true);
  const selectedUser3 = await ormTableFacet.selectById(insertReturn.serialNo);
  expect(selectedUser3).toEqual(null);

  // inserting user with a truthy ID should fail
  await expect(
    ormTableFacet.insert(new OrmUser(5, "Xana", "Xana", "xana", "xana@abc.def"))
  ).rejects.toThrowError("must be falsy");
});
