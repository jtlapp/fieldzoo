import { Kysely, Selectable } from "kysely";

import { KyselyFacet } from "../..";
import { createDB, resetDB, destroyDB } from "./utils/test-setup";
import { Database, Users } from "./utils/test-tables";
import { USERS } from "./utils/test-objects";

export class PlainUserFacet extends KyselyFacet<
  Database,
  "users",
  Selectable<Users>
> {
  constructor(readonly db: Kysely<Database>) {
    super(db, "users");
  }
}

let db: Kysely<Database>;
let plainUserFacet: PlainUserFacet;

beforeAll(async () => {
  db = await createDB();
  plainUserFacet = new PlainUserFacet(db);
});
beforeEach(() => resetDB(db));
afterAll(() => destroyDB(db));

describe("basic row queries", () => {
  it("inserts, selects, updates, and deletes objects by row query", async () => {
    // Add users by row query
    const user0 = (await plainUserFacet
      .insertRows()
      .values(USERS[0])
      .returningAll()
      .executeTakeFirst())!;
    const user1 = (await plainUserFacet
      .insertRows()
      .values(USERS[1])
      .returningAll()
      .executeTakeFirst())!;

    // Update a user by row query
    const NEW_EMAIL = "new@baz.com";
    user1.email = NEW_EMAIL;
    await plainUserFacet
      .updateRows()
      .set(user1)
      .where("id", "=", user1.id)
      .execute();

    // Retrieves user by row query
    const readUser1 = await plainUserFacet
      .selectRows()
      .where("id", "=", user1.id)
      .executeTakeFirst();
    expect(readUser1?.handle).toEqual(USERS[1].handle);
    expect(readUser1?.email).toEqual(NEW_EMAIL);

    // Delete user by row query
    await plainUserFacet.deleteRows().where("id", "=", user1.id).execute();

    // Verify correct user was deleted
    const readUser0 = await plainUserFacet
      .selectRows()
      .where("id", "=", user0.id)
      .executeTakeFirst();
    expect(readUser0?.handle).toEqual(USERS[0].handle);

    const noUser = await plainUserFacet
      .selectRows()
      .where("id", "=", user1.id)
      .executeTakeFirst();
    expect(noUser).toBeUndefined();
  });
});
