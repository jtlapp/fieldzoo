import { Kysely, Selectable } from "kysely";

import { KyselyFacet } from "../..";
import { createDB, resetDB, destroyDB } from "./utils/test-setup";
import { Database, Users } from "./utils/test-tables";
import {
  USERS,
  userRow1,
  userRow2,
  selectedUser1,
  selectedUser2,
} from "./utils/test-objects";
import { SelectedUser } from "./utils/test-types";
import { ignore } from "@fieldzoo/testing-utils";

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

describe("transforms selection objects", () => {
  class TestPassThruFacet extends KyselyFacet<Database, "users"> {
    constructor(db: Kysely<Database>) {
      super(db, "users");
    }

    testTransformSelection() {
      const user1 = { id: 1, ...userRow1 };
      const user2 = { id: 2, ...userRow2 };

      expect(this.transformSelection(user1)).toEqual(user1);
      expect(this.transformSelection([user1, user2])).toEqual([user1, user2]);
    }
  }
  const testPassThruFacet = new TestPassThruFacet(db);

  class TestTransformFacet extends KyselyFacet<
    Database,
    "users",
    SelectedUser
  > {
    constructor(db: Kysely<Database>) {
      super(
        db,
        "users",
        (source) =>
          new SelectedUser(
            source.id,
            source.name.split(" ")[0],
            source.name.split(" ")[1],
            source.handle,
            source.email
          )
      );
    }

    testTransformSelection() {
      expect(this.transformSelection({ id: 1, ...userRow1 })).toEqual(
        selectedUser1
      );

      expect(
        this.transformSelection([
          { id: 1, ...userRow1 },
          { id: 2, ...userRow2 },
        ])
      ).toEqual([selectedUser1, selectedUser2]);

      ignore("detects transformSelection type errors", () => {
        const userObject = {
          id: 1,
          ...userRow1,
        };

        // @ts-expect-error - incorrect output type
        this.transformSelection(userObject).name;
        // @ts-expect-error - incorrect output type
        this.transformSelection([userObject])[0].name;
      });
    }
  }
  const testTransformFacet = new TestTransformFacet(db);

  it("transforms selections", () => {
    testPassThruFacet.testTransformSelection();
    testTransformFacet.testTransformSelection();
  });
});
