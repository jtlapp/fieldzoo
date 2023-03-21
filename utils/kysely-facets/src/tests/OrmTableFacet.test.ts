import { Kysely } from "kysely";

import { createDB, resetDB, destroyDB } from "./utils/test-setup";
import { Database } from "./utils/test-tables";
import { USERS, insertedUser1 } from "./utils/test-objects";
import { User } from "./utils/test-types";
import { OrmTableFacet } from "../facets/OrmTableFacet";

let db: Kysely<Database>;

beforeAll(async () => {
  db = await createDB();
});
beforeEach(() => resetDB(db));
afterAll(() => destroyDB(db));

it("inserts/updates/deletes a mapped object w/ default transforms", async () => {
  const ormTableFacet = new OrmTableFacet<Database, "users">(db, "users", "id");

  // test updating a non-existent user
  const updateReturn1 = await ormTableFacet.upsert({
    ...USERS[0],
    id: 1,
  });
  expect(updateReturn1).toEqual(null);

  // test inserting a user
  const insertReturn = (await ormTableFacet.upsert({ ...USERS[0], id: 0 }))!;
  expect(insertReturn).not.toBeNull();
  expect(insertReturn.id).toBeGreaterThan(0);

  // test getting a user by ID
  const selectedUser1 = await ormTableFacet.selectById(insertReturn.id);
  expect(selectedUser1).toEqual(insertReturn);
  expect(selectedUser1?.id).toEqual(insertReturn.id);

  // test updating a user
  const updaterUser = { ...selectedUser1!, name: "Xana" };
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
  await expect(
    ormTableFacet.insert({ ...USERS[1], id: 1 })
  ).rejects.toThrowError("must be falsy");
});

it("inserts/updates/deletes a mapped object class w/ custom transforms", async () => {
  const insertTransform = (user: User) => {
    return {
      name: `${user.firstName} ${user.lastName}`,
      handle: user.handle,
      email: user.email,
    };
  };

  // TODO: rearrange type params so can assign User and infer the rest
  const ormTableFacet = new OrmTableFacet<Database, "users", "id", User>(
    db,
    "users",
    "id",
    {
      insertTransform,
      insertReturnTransform: (user, returns) => {
        return new User(
          returns.id,
          user.firstName,
          user.lastName,
          user.handle,
          user.email
        );
      },
      updaterTransform: insertTransform,
      selectTransform: (row) => {
        const names = row.name.split(" ");
        return new User(row.id, names[0], names[1], row.handle, row.email);
      },
    }
  );

  // test updating a non-existent user
  const updateReturn1 = await ormTableFacet.upsert({
    ...insertedUser1,
    id: 1,
  });
  expect(updateReturn1).toEqual(null);

  // test inserting a user
  const insertReturn = (await ormTableFacet.upsert(insertedUser1))!;
  expect(insertReturn).not.toBeNull();
  expect(insertReturn.id).toBeGreaterThan(0);

  // test getting a user by ID
  const selectedUser1 = await ormTableFacet.selectById(insertReturn.id);
  expect(selectedUser1).toEqual(insertReturn);
  expect(selectedUser1?.id).toEqual(insertReturn.id);

  // test updating a user
  const updaterUser = new User(
    selectedUser1!.id,
    selectedUser1!.firstName,
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
  await expect(
    ormTableFacet.insert(new User(5, "Xana", "Xana", "xana", "xana@abc.def"))
  ).rejects.toThrowError("must be falsy");
});
