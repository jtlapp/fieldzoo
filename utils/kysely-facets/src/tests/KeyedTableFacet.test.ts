import { Kysely } from "kysely";

import { createDB, resetDB, destroyDB } from "./utils/test-setup";
import { Database } from "./utils/test-tables";
import {
  USERS,
  STANDARD_OPTIONS,
  insertedUser1,
  selectedUser1,
} from "./utils/test-objects";
import { KeyedTableFacet } from "../facets/KeyedTableFacet";
import { ReturnedUser, SelectedUser, UpdaterUser } from "./utils/test-types";
import { ignore } from "@fieldzoo/testing-utils";

class ExplicitKeyedFacet extends KeyedTableFacet<Database, "users", ["id"]> {
  constructor(readonly db: Kysely<Database>) {
    super(db, "users", ["id"], { returnColumns: ["id"] });
  }
}

let db: Kysely<Database>;
let explicitKeyedFacet: ExplicitKeyedFacet;

beforeAll(async () => {
  db = await createDB();
  explicitKeyedFacet = new ExplicitKeyedFacet(db);
});
beforeEach(() => resetDB(db));
afterAll(() => destroyDB(db));

describe("keyed table facet using a single-element tuple key", () => {
  ignore("requires return columns to include ID field", () => {
    new KeyedTableFacet<Database, "users", ["id"]>(db, "users", ["id"], {
      // @ts-expect-error - actual and declared return types must match
      returnColumns: ["name"],
    });
    new KeyedTableFacet<Database, "users", ["id"]>(db, "users", ["id"], {
      // @ts-expect-error - actual and declared return types must match
      returnColumns: ["id", "name"],
    });
  });

  it("selects, updates, and deletes nothing when no rows match", async () => {
    const readUser = await explicitKeyedFacet.selectByKey([1]);
    expect(readUser).toBeNull();

    const updated = await explicitKeyedFacet.updateByKey([1], {
      email: "new@baz.com",
    });
    expect(updated).toEqual(false);

    const deleted = await explicitKeyedFacet.deleteByKey([1]);
    expect(deleted).toEqual(false);
  });

  it("inserts, selects, updates, and deletes objects by ID", async () => {
    // Add users
    const id0 = (await explicitKeyedFacet.insert(USERS[0])).id;
    const id1 = (await explicitKeyedFacet.insert(USERS[1])).id;

    // Update a user without returning columns
    const NEW_EMAIL = "new@baz.com";
    const updated = await explicitKeyedFacet.updateByKey([id1], {
      email: NEW_EMAIL,
    });
    expect(updated).toEqual(true);

    // Retrieves a user by ID
    const readUser1 = await explicitKeyedFacet.selectByKey([id1]);
    expect(readUser1?.handle).toEqual(USERS[1].handle);
    expect(readUser1?.email).toEqual(NEW_EMAIL);

    // Delete a user
    const deleted = await explicitKeyedFacet.deleteByKey([id1]);
    expect(deleted).toEqual(true);

    // Verify correct user was deleted
    const readUser0 = await explicitKeyedFacet.selectByKey([id0]);
    expect(readUser0?.handle).toEqual(USERS[0].handle);
    const noUser = await explicitKeyedFacet.selectByKey([id1]);
    expect(noUser).toBeNull();
  });

  it("updates returning all columns by default with default ID", async () => {
    const defaultIdFacet = new KeyedTableFacet(db, "users");
    const id1 = (await defaultIdFacet.insert(USERS[1])).id;

    const NEW_EMAIL = "new@baz.com";
    const updated = await defaultIdFacet.updateByKeyReturning([id1], {
      email: NEW_EMAIL,
    });
    expect(updated).toEqual(
      Object.assign({}, USERS[1], { id: id1, email: NEW_EMAIL })
    );
  });

  it("updates returning all columns by default with specified ID", async () => {
    const defaultIdFacet = new KeyedTableFacet(db, "users", ["id"]);
    const id1 = (await defaultIdFacet.insert(USERS[1])).id;

    const NEW_EMAIL = "new@baz.com";
    const updated = await defaultIdFacet.updateByKeyReturning([id1], {
      email: NEW_EMAIL,
    });
    expect(updated).toEqual(
      Object.assign({}, USERS[1], { id: id1, email: NEW_EMAIL })
    );
  });

  it("updates returning expected columns", async () => {
    const id1 = (await explicitKeyedFacet.insert(USERS[1])).id;

    const NEW_EMAIL = "new@baz.com";
    const updated = await explicitKeyedFacet.updateByKeyReturning([id1], {
      email: NEW_EMAIL,
    });
    // prettier-ignore
    expect(updated).toEqual({ id: id1 });
  });

  it("provides a default ID of 'id'", async () => {
    const defaultIdFacet = new KeyedTableFacet(db, "users");

    await defaultIdFacet.insert(USERS[0]);
    const id1 = (await defaultIdFacet.insert(USERS[1])).id;

    const readUser1 = await explicitKeyedFacet.selectByKey([id1]);
    expect(readUser1?.handle).toEqual(USERS[1].handle);
  });

  it("allows for returning other columns with the ID", async () => {
    const idAndHandleFacet = new KeyedTableFacet(db, "users", ["id"], {
      returnColumns: ["id", "handle"],
    });

    const insertReturn1 = await idAndHandleFacet.insert(USERS[0]);
    expect(insertReturn1).toEqual({
      id: 1,
      handle: USERS[0].handle,
    });

    const insertReturn2 = await idAndHandleFacet.insert(USERS[1]);
    expect(insertReturn2).toEqual({
      id: 2,
      handle: USERS[1].handle,
    });
  });

  it("allows for returning all columns", async () => {
    const allColumnsFacet = new KeyedTableFacet(db, "users", ["id"]);

    const insertReturn1 = await allColumnsFacet.insert(USERS[0]);
    expect(insertReturn1).toEqual({
      id: 1,
      handle: USERS[0].handle,
      name: USERS[0].name,
      email: USERS[0].email,
    });

    const insertReturn2 = await allColumnsFacet.insert(USERS[1]);
    expect(insertReturn2).toEqual({
      id: 2,
      handle: USERS[1].handle,
      name: USERS[1].name,
      email: USERS[1].email,
    });
  });

  it("transforms inputs and outputs", async () => {
    const testTransformFacet = new KeyedTableFacet(
      db,
      "users",
      ["id"],
      STANDARD_OPTIONS
    );

    const insertReturn1 = await testTransformFacet.insert(insertedUser1);
    expect(insertReturn1).toEqual(ReturnedUser.create(1, insertedUser1));

    const readUser1 = await testTransformFacet.selectByKey([1]);
    expect(readUser1).toEqual(selectedUser1);

    const updaterUser = new UpdaterUser(
      1,
      "Jimmy",
      "James",
      "jjames",
      "jjames@abc.def"
    );
    const updated = await testTransformFacet.updateByKey(
      [updaterUser.id],
      updaterUser
    );
    expect(updated).toEqual(true);

    const readUser2 = await testTransformFacet.selectByKey([1]);
    expect(readUser2).toEqual(SelectedUser.create(1, updaterUser));

    const deleted = await testTransformFacet.deleteByKey([1]);
    expect(deleted).toEqual(true);

    const readUser3 = await testTransformFacet.selectByKey([1]);
    expect(readUser3).toBeNull();
  });

  it("errors when ID column is not in 'returnColumns'", async () => {
    expect(() => {
      new KeyedTableFacet(db, "users", ["id"], {
        returnColumns: ["handle"],
      });
    }).toThrowError("'returnColumns' must include");
  });
});
