import { Kysely } from "kysely";

import { createDB, resetDB, destroyDB } from "./utils/test-setup";
import { Database } from "./utils/test-tables";
import { UserFacet } from "./utils/test-facets";
import { USERS } from "./utils/test-objects";

let db: Kysely<Database>;
let userFacet: UserFacet;

beforeAll(async () => {
  db = await createDB();
  userFacet = new UserFacet(db);
});
beforeEach(() => resetDB(db));
afterAll(() => destroyDB(db));

describe("tables with unique keys", () => {
  it("inserts, selects, updates, and deletes objects by ID", async () => {
    // Add users
    const update0 = await userFacet.insertOne(USERS[0], ["id", "email"]);
    const update1 = await userFacet.insertOne(USERS[1], ["id", "email"]);

    // Update a user
    const NEW_EMAIL = "new@baz.com";
    update1.email = NEW_EMAIL;
    const updated = await userFacet.updateById(update1);
    expect(updated).toEqual(true);

    // Retrieves a user by ID
    const readUser1 = await userFacet.selectById(update1.id);
    expect(readUser1?.handle).toEqual(USERS[1].handle);
    expect(readUser1?.email).toEqual(NEW_EMAIL);

    // Delete a user
    const deleted = await userFacet.deleteById(update1.id);
    expect(deleted).toEqual(true);

    // Verify correct user was deleted
    const readUser0 = await userFacet.selectById(update0.id);
    expect(readUser0?.handle).toEqual(USERS[0].handle);
    const noUser = await userFacet.selectById(update1.id);
    expect(noUser).toBeNull();
  });
});
