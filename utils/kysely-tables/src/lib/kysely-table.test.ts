import { Kysely } from "kysely";

import { createDB, resetDB, destroyDB } from "../test-utils/test-setup";
import { Database, UserTable } from "../test-utils/test-tables";

let db: Kysely<Database>;
let userTable: UserTable;

beforeAll(async () => {
  db = await createDB();
  userTable = new UserTable(db);
});
beforeEach(() => resetDB(db));
afterAll(() => destroyDB(db));

const USER1 = {
  handle: "handle1",
  email: "foo@bar.com",
};

describe("user repo", () => {
  it("should work", async () => {
    // Add a user
    const insertedUser = await userTable.insert(USER1);

    // Verify that the user was added
    const user = await userTable.findById(insertedUser.id);
    expect(user?.handle).toEqual(USER1.handle);
    expect(user?.email).toEqual(USER1.email);
  });
});
