import { Kysely } from "kysely";

import { createDB, resetDB, destroyDB } from "./utils/test-setup";
import { Database } from "./utils/test-tables";
import { USERS } from "./utils/test-objects";
import { IdFacet } from "../facets/IdFacet";

class PassThruUserFacet extends IdFacet<Database, "users", "id"> {
  constructor(readonly db: Kysely<Database>) {
    super(db, "users", "id");
  }
}

let db: Kysely<Database>;
let plainUserFacet: PassThruUserFacet;

beforeAll(async () => {
  db = await createDB();
  plainUserFacet = new PassThruUserFacet(db);
});
beforeEach(() => resetDB(db));
afterAll(() => destroyDB(db));

describe("tables with unique keys", () => {
  it("inserts, selects, updates, and deletes objects by ID", async () => {
    // Add users
    const id0 = (await plainUserFacet.insertOne(USERS[0])).id;
    const id1 = (await plainUserFacet.insertOne(USERS[1])).id;

    // Update a user
    const NEW_EMAIL = "new@baz.com";
    const updated = await plainUserFacet.updateById({
      id: id1,
      email: NEW_EMAIL,
    });
    expect(updated).toEqual(true);

    // Retrieves a user by ID
    const readUser1 = await plainUserFacet.selectById(id1);
    expect(readUser1?.handle).toEqual(USERS[1].handle);
    expect(readUser1?.email).toEqual(NEW_EMAIL);

    // Delete a user
    const deleted = await plainUserFacet.deleteById(id1);
    expect(deleted).toEqual(true);

    // Verify correct user was deleted
    const readUser0 = await plainUserFacet.selectById(id0);
    expect(readUser0?.handle).toEqual(USERS[0].handle);
    const noUser = await plainUserFacet.selectById(id1);
    expect(noUser).toBeNull();
  });
});
