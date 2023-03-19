import { Insertable, Kysely, Selectable } from "kysely";

import { createDB, resetDB, destroyDB } from "./utils/test-setup";
import { Database, Users } from "./utils/test-tables";
import {
  USERS,
  STANDARD_OPTIONS,
  insertedUser1,
  selectedUser1,
} from "./utils/test-objects";
import { IdTableFacet } from "../facets/IdTableFacet";
import { ReturnedUser, SelectedUser, UpdaterUser } from "./utils/test-types";
import { ignore } from "@fieldzoo/testing-utils";

class ExplicitIdFacet extends IdTableFacet<
  Database,
  "users",
  "id",
  Selectable<Users>,
  Insertable<Users>,
  Partial<Insertable<Users>>,
  ["id"]
> {
  constructor(readonly db: Kysely<Database>) {
    super(db, "users", "id", { returnColumns: ["id"] });
  }
}

let db: Kysely<Database>;
let explicitIdFacet: ExplicitIdFacet;

beforeAll(async () => {
  db = await createDB();
  explicitIdFacet = new ExplicitIdFacet(db);
});
beforeEach(() => resetDB(db));
afterAll(() => destroyDB(db));

describe("facet for table with unique ID", () => {
  ignore("requires return columns to include ID field", () => {
    new IdTableFacet<Database, "users", "id">(db, "users", "id", {
      // @ts-expect-error - actual and declared return types must match
      returnColumns: ["name"],
    });
    new IdTableFacet<Database, "users", "id">(db, "users", "id", {
      // @ts-expect-error - actual and declared return types must match
      returnColumns: ["id", "name"],
    });
  });

  it("selects, updates, and deletes nothing when no rows match", async () => {
    const readUser = await explicitIdFacet.selectById(1);
    expect(readUser).toBeNull();

    const updated = await explicitIdFacet.updateById({
      id: 1,
      email: "new@baz.com",
    });
    expect(updated).toEqual(false);

    const deleted = await explicitIdFacet.deleteById(1);
    expect(deleted).toEqual(false);
  });

  it("inserts, selects, updates, and deletes objects by ID", async () => {
    // Add users
    const id0 = (await explicitIdFacet.insertReturning(USERS[0])).id;
    const id1 = (await explicitIdFacet.insertReturning(USERS[1])).id;

    // Update a user without returning columns
    const NEW_EMAIL = "new@baz.com";
    const updated = await explicitIdFacet.updateById({
      id: id1,
      email: NEW_EMAIL,
    });
    expect(updated).toEqual(true);

    // Retrieves a user by ID
    const readUser1 = await explicitIdFacet.selectById(id1);
    expect(readUser1?.handle).toEqual(USERS[1].handle);
    expect(readUser1?.email).toEqual(NEW_EMAIL);

    // Delete a user
    const deleted = await explicitIdFacet.deleteById(id1);
    expect(deleted).toEqual(true);

    // Verify correct user was deleted
    const readUser0 = await explicitIdFacet.selectById(id0);
    expect(readUser0?.handle).toEqual(USERS[0].handle);
    const noUser = await explicitIdFacet.selectById(id1);
    expect(noUser).toBeNull();
  });

  it("updates returning all columns by default with default ID", async () => {
    const defaultIdFacet = new IdTableFacet(db, "users");
    const id1 = (await defaultIdFacet.insertReturning(USERS[1])).id;

    const NEW_EMAIL = "new@baz.com";
    const updated = await defaultIdFacet.updateByIdReturning({
      id: id1,
      email: NEW_EMAIL,
    });
    expect(updated).toEqual(
      Object.assign({}, USERS[1], { id: id1, email: NEW_EMAIL })
    );
  });

  it("updates returning all columns by default with specified ID", async () => {
    const defaultIdFacet = new IdTableFacet(db, "users", "id");
    const id1 = (await defaultIdFacet.insertReturning(USERS[1])).id;

    const NEW_EMAIL = "new@baz.com";
    const updated = await defaultIdFacet.updateByIdReturning({
      id: id1,
      email: NEW_EMAIL,
    });
    expect(updated).toEqual(
      Object.assign({}, USERS[1], { id: id1, email: NEW_EMAIL })
    );
  });

  it("updates returning expected columns", async () => {
    const id1 = (await explicitIdFacet.insertReturning(USERS[1])).id;

    const NEW_EMAIL = "new@baz.com";
    const updated = await explicitIdFacet.updateByIdReturning({
      id: id1,
      email: NEW_EMAIL,
    });
    // prettier-ignore
    expect(updated).toEqual({ id: id1 });
  });

  it("provides a default ID of 'id'", async () => {
    const defaultIdFacet = new IdTableFacet(db, "users");

    await defaultIdFacet.insert(USERS[0]);
    const id1 = (await defaultIdFacet.insertReturning(USERS[1])).id;

    const readUser1 = await explicitIdFacet.selectById(id1);
    expect(readUser1?.handle).toEqual(USERS[1].handle);
  });

  it("allows for returning other columns with the ID", async () => {
    const idAndHandleFacet = new IdTableFacet(db, "users", "id", {
      returnColumns: ["id", "handle"],
    });

    const insertReturn1 = await idAndHandleFacet.insertReturning(USERS[0]);
    expect(insertReturn1).toEqual({
      id: 1,
      handle: USERS[0].handle,
    });

    const insertReturn2 = await idAndHandleFacet.insertReturning(USERS[1]);
    expect(insertReturn2).toEqual({
      id: 2,
      handle: USERS[1].handle,
    });
  });

  it("allows for returning all columns", async () => {
    const allColumnsFacet = new IdTableFacet(db, "users", "id");

    const insertReturn1 = await allColumnsFacet.insertReturning(USERS[0]);
    expect(insertReturn1).toEqual({
      id: 1,
      handle: USERS[0].handle,
      name: USERS[0].name,
      email: USERS[0].email,
    });

    const insertReturn2 = await allColumnsFacet.insertReturning(USERS[1]);
    expect(insertReturn2).toEqual({
      id: 2,
      handle: USERS[1].handle,
      name: USERS[1].name,
      email: USERS[1].email,
    });
  });

  it("transforms inputs and outputs", async () => {
    const testTransformFacet = new IdTableFacet(
      db,
      "users",
      "id",
      STANDARD_OPTIONS
    );

    const insertReturn1 = await testTransformFacet.insertReturning(
      insertedUser1
    );
    expect(insertReturn1).toEqual(ReturnedUser.create(1, insertedUser1));

    const readUser1 = await testTransformFacet.selectById(1);
    expect(readUser1).toEqual(selectedUser1);

    const updaterUser = new UpdaterUser(
      1,
      "Jimmy",
      "James",
      "jjames",
      "jjames@abc.def"
    );
    const updated = await testTransformFacet.updateById(updaterUser);
    expect(updated).toEqual(true);

    const readUser2 = await testTransformFacet.selectById(1);
    expect(readUser2).toEqual(SelectedUser.create(1, updaterUser));

    const deleted = await testTransformFacet.deleteById(1);
    expect(deleted).toEqual(true);

    const readUser3 = await testTransformFacet.selectById(1);
    expect(readUser3).toBeNull();
  });

  it("errors when ID column is not in 'returnColumns'", async () => {
    expect(() => {
      new IdTableFacet(db, "users", "id", {
        returnColumns: ["handle"],
      });
    }).toThrowError("'returnColumns' must include 'idColumnName'");
  });
});
