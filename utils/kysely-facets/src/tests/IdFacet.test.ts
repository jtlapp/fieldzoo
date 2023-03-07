import { Kysely } from "kysely";

import { createDB, resetDB, destroyDB } from "./utils/test-setup";
import { Database } from "./utils/test-tables";
import { PassThruUserFacet } from "./utils/test-facets";
import { USERS } from "./utils/test-objects";

let db: Kysely<Database>;
let passThruUserFacet: PassThruUserFacet;

beforeAll(async () => {
  db = await createDB();
  passThruUserFacet = new PassThruUserFacet(db);
});
beforeEach(() => resetDB(db));
afterAll(() => destroyDB(db));

describe("tables with unique keys", () => {
  it("inserts, selects, updates, and deletes objects by ID", async () => {
    // Add users
    const update0 = await passThruUserFacet.insertOne(USERS[0], [
      "id",
      "email",
    ]);
    const update1 = await passThruUserFacet.insertOne(USERS[1], [
      "id",
      "email",
    ]);

    // Update a user
    const NEW_EMAIL = "new@baz.com";
    update1.email = NEW_EMAIL;
    const updated = await passThruUserFacet.updateById(update1);
    expect(updated).toEqual(true);

    // Retrieves a user by ID
    const readUser1 = await passThruUserFacet.selectById(update1.id);
    expect(readUser1?.handle).toEqual(USERS[1].handle);
    expect(readUser1?.email).toEqual(NEW_EMAIL);

    // Delete a user
    const deleted = await passThruUserFacet.deleteById(update1.id);
    expect(deleted).toEqual(true);

    // Verify correct user was deleted
    const readUser0 = await passThruUserFacet.selectById(update0.id);
    expect(readUser0?.handle).toEqual(USERS[0].handle);
    const noUser = await passThruUserFacet.selectById(update1.id);
    expect(noUser).toBeNull();
  });
});
