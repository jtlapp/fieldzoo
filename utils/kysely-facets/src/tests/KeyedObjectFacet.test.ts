import { Kysely } from "kysely";

import { createDB, resetDB, destroyDB } from "./utils/test-setup";
import { Database, Users } from "./utils/test-tables";
import { USERS, insertedUser1 } from "./utils/test-objects";
import { KeyedObject, KeyedObjectFacet } from "../facets/KeyedObjectFacet";

let db: Kysely<Database>;

beforeAll(async () => {
  db = await createDB();
});
beforeEach(() => resetDB(db));
afterAll(() => destroyDB(db));

it("inserts/updates/deletes a mapped object w/ default transforms", async () => {
  class KeyedUser implements KeyedObject<Users, ["id"]> {
    constructor(
      public id: number,
      public name: string,
      public handle: string,
      public email: string
    ) {}

    getKey(): [number] {
      return [this.id];
    }
  }

  const keyedUserFacet = new KeyedObjectFacet<Database, "users", KeyedUser>(
    db,
    "users",
    ["id"]
  );

  // test updating a non-existent user
  const userWithID = new KeyedUser(
    1,
    USERS[0].name,
    USERS[0].handle,
    USERS[0].email
  );
  const updateReturn1 = await keyedUserFacet.save(userWithID);
  expect(updateReturn1).toEqual(null);

  // test inserting a user
  const insertedUser = new KeyedUser(
    0,
    USERS[0].name,
    USERS[0].handle,
    USERS[0].email
  );
  const insertReturn = (await keyedUserFacet.save(insertedUser))!;
  expect(insertReturn).not.toBeNull();
  expect(insertReturn.id).toBeGreaterThan(0);

  // test getting a user by ID
  const selectedUser1 = await keyedUserFacet.selectByKey(insertReturn.id);
  expect(selectedUser1).toEqual(insertReturn);
  expect(selectedUser1?.id).toEqual(insertReturn.id);

  // test updating a user
  const updaterUser = new KeyedUser(
    selectedUser1!.id,
    "Xana",
    selectedUser1!.handle,
    selectedUser1!.email
  );
  const updateReturn = await keyedUserFacet.save(updaterUser);
  expect(updateReturn).toEqual(updaterUser);
  const selectedUser2 = await keyedUserFacet.selectByKey(insertReturn.id);
  expect(selectedUser2).toEqual(updateReturn);

  // test deleting a user
  const deleted = await keyedUserFacet.deleteByKey(insertReturn.id);
  expect(deleted).toEqual(true);
  const selectedUser3 = await keyedUserFacet.selectByKey(insertReturn.id);
  expect(selectedUser3).toEqual(null);
});

it("inserts/updates/deletes a mapped object class w/ custom transforms", async () => {
  class KeyedUser implements KeyedObject<Users, ["id"]> {
    constructor(
      public serialNo: number,
      public firstName: string,
      public lastName: string,
      public handle: string,
      public email: string
    ) {}

    getKey(): [number] {
      return [this.serialNo];
    }
  }

  const insertTransform = (user: KeyedUser) => {
    return {
      name: `${user.firstName} ${user.lastName}`,
      handle: user.handle,
      email: user.email,
    };
  };

  const keyedUserFacet = new KeyedObjectFacet(db, "users", ["id"], {
    insertTransform,
    insertReturnTransform: (user, returns) => {
      return new KeyedUser(
        returns.id,
        user.firstName,
        user.lastName,
        user.handle,
        user.email
      );
    },
    updaterTransform: insertTransform,
    updateReturnTransform: (user, _returns) => {
      return new KeyedUser(
        user.serialNo,
        user.firstName,
        user.lastName,
        user.handle,
        user.email
      );
    },
    selectTransform: (row) => {
      const names = row.name.split(" ");
      return new KeyedUser(row.id, names[0], names[1], row.handle, row.email);
    },
  });

  // test updating a non-existent user
  const updateReturn1 = await keyedUserFacet.save(
    new KeyedUser(
      1,
      insertedUser1.firstName,
      insertedUser1.lastName,
      insertedUser1.handle,
      insertedUser1.email
    )
  );
  expect(updateReturn1).toEqual(null);

  // test inserting a user
  const insertedUser = new KeyedUser(
    0,
    insertedUser1.firstName,
    insertedUser1.lastName,
    insertedUser1.handle,
    insertedUser1.email
  );
  const insertReturn = (await keyedUserFacet.save(insertedUser))!;
  expect(insertReturn).not.toBeNull();
  expect(insertReturn.serialNo).toBeGreaterThan(0);

  // test getting a user by ID
  const selectedUser1 = await keyedUserFacet.selectByKey(insertReturn.serialNo);
  expect(selectedUser1).toEqual(insertReturn);
  expect(selectedUser1?.serialNo).toEqual(insertReturn.serialNo);

  // test updating a user
  const updaterUser = new KeyedUser(
    selectedUser1!.serialNo,
    selectedUser1!.firstName,
    "Xana",
    selectedUser1!.handle,
    selectedUser1!.email
  );
  const updateReturn = await keyedUserFacet.save(updaterUser);
  expect(updateReturn).toEqual(updaterUser);
  const selectedUser2 = await keyedUserFacet.selectByKey(insertReturn.serialNo);
  expect(selectedUser2).toEqual(updateReturn);

  // test deleting a user
  const deleted = await keyedUserFacet.deleteByKey(insertReturn.serialNo);
  expect(deleted).toEqual(true);
  const selectedUser3 = await keyedUserFacet.selectByKey(insertReturn.serialNo);
  expect(selectedUser3).toEqual(null);
});
