import { Kysely } from "kysely";

import { createDB, resetDB, destroyDB } from "./utils/test-setup";
import { Database } from "./utils/test-tables";
import { USERS } from "./utils/test-objects";
import { StandardIdFacet } from "../facets/StandardIdFacet";

class ExplicitIdFacet extends StandardIdFacet<Database, "users", "id"> {
  constructor(readonly db: Kysely<Database>) {
    super(db, "users", "id");
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
  it("inserts, selects, updates, and deletes objects by ID", async () => {
    // Add users
    const id0 = (await explicitIdFacet.insert(USERS[0])).id;
    const id1 = (await explicitIdFacet.insert(USERS[1])).id;

    // Update a user
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

  it("provides a default ID of 'id'", async () => {
    const defaultIdFacet = new StandardIdFacet(db, "users");

    await defaultIdFacet.insert(USERS[0]);
    const id1 = (await defaultIdFacet.insert(USERS[1])).id;

    const readUser1 = await explicitIdFacet.selectById(id1);
    expect(readUser1?.handle).toEqual(USERS[1].handle);
  });

  it("allows for returning other columns with the ID", async () => {
    const idAndHandleFacet = new StandardIdFacet(db, "users", "id", {
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
    const allColumnsFacet = new StandardIdFacet(db, "users", "id", {
      returnColumns: ["*"],
    });

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

  // TODO: maybe add tests for transforms

  it("errors when ID column is not in 'returnColumns'", async () => {
    expect(() => {
      new StandardIdFacet(db, "users", "id", {
        returnColumns: ["handle"],
      });
    }).toThrowError("returnColumns must include idColumnName");
  });
});
