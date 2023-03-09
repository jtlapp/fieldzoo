import { Insertable, Kysely, Selectable } from "kysely";

import { KyselyFacet } from "../..";
import { createDB, resetDB, destroyDB } from "./utils/test-setup";
import { Database, Users } from "./utils/test-tables";
import {
  USERS,
  userRow1,
  userRow2,
  userObject1,
  selectedUser1,
  selectedUser2,
  insertedUser1,
  insertedUser2,
  insertReturnedUser1,
  insertReturnedUser2,
  updatedUser1,
  updatedUser2,
} from "./utils/test-objects";
import {
  User,
  SelectedUser,
  InsertedUser,
  UpdatedUser,
  ReturnedUser,
} from "./utils/test-types";
import { ignore } from "@fieldzoo/testing-utils";

export class PlainUserFacet extends KyselyFacet<
  Database,
  "users",
  Selectable<Users>,
  Insertable<Users>,
  Partial<Insertable<Users>>,
  ["id"]
> {
  constructor(readonly db: Kysely<Database>) {
    super(db, "users", { returnColumns: ["id"] });
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

const userObjectWithID = { id: 1, ...userObject1 };

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

describe("transforms between inputs and outputs", () => {
  class TestPassThruFacet extends KyselyFacet<Database, "users"> {
    constructor(db: Kysely<Database>) {
      super(db, "users");
    }

    testTransformInsertion() {
      expect(this.transformInsertion(userRow1)).toEqual(userRow1);
      expect(this.transformInsertion([userRow1, userRow2])).toEqual([
        userRow1,
        userRow2,
      ]);
    }

    testTransformSelection() {
      const user1 = { id: 1, ...userRow1 };
      const user2 = { id: 2, ...userRow2 };

      expect(this.transformSelection(user1)).toEqual(user1);
      expect(this.transformSelection([user1, user2])).toEqual([user1, user2]);
    }

    testTransformUpdate() {
      const user1 = { id: 1, ...userRow1 };
      const user2 = { id: 2, ...userRow2 };

      expect(this.transformUpdate(user1)).toEqual(user1);
      expect(this.transformUpdate([user1, user2])).toEqual([user1, user2]);
    }

    testTransformInsertReturn() {
      expect(this.transformInsertReturn(userRow1, { id: 1 })).toEqual({
        id: 1,
      });
      expect(
        this.transformInsertReturn([userRow1, userRow2], [{ id: 1 }, { id: 2 }])
      ).toEqual([{ id: 1 }, { id: 2 }]);
    }

    testTransformUpdateReturn() {
      expect(this.transformUpdateReturn(userRow1, [{ id: 1 }])).toEqual([
        { id: 1 },
      ]);
      expect(
        this.transformUpdateReturn(userRow1, [{ id: 1 }, { id: 2 }])
      ).toEqual([{ id: 1 }, { id: 2 }]);
    }
  }
  const testPassThruFacet = new TestPassThruFacet(db);

  class TestTransformFacet extends KyselyFacet<
    Database,
    "users",
    SelectedUser,
    InsertedUser,
    UpdatedUser,
    ["id"],
    ReturnedUser
  > {
    constructor(db: Kysely<Database>) {
      super(db, "users", {
        selectTransform: (source) =>
          new SelectedUser(
            source.id,
            source.name.split(" ")[0],
            source.name.split(" ")[1],
            source.handle,
            source.email
          ),
        insertTransform: (source) => ({
          name: `${source.firstName} ${source.lastName}`,
          handle: source.handle,
          email: source.email,
        }),
        updateTransform: (source) => ({
          name: `${source.firstName} ${source.lastName}`,
          handle: source.handle,
          email: source.email,
        }),
        insertReturnTransform: (source, returns) => {
          const returnedUser = new ReturnedUser(
            source.id,
            source.firstName,
            source.lastName,
            source.handle,
            source.email
          );
          if (returns.id) returnedUser.id = returns.id;
          if (returns.handle) returnedUser.handle = returns.handle;
          if (returns.email) returnedUser.email = returns.email;
          if (returns.name) {
            returnedUser.firstName = returns.name.split(" ")[0];
            returnedUser.lastName = returns.name.split(" ")[1];
          }
          return returnedUser;
        },
        updateReturnTransform: (source, returns) => {
          const returnedUser = new ReturnedUser(
            source.id,
            source.firstName,
            source.lastName,
            source.handle,
            source.email
          );
          if (returns.id) returnedUser.id = returns.id;
          if (returns.handle) returnedUser.handle = returns.handle;
          if (returns.email) returnedUser.email = returns.email;
          if (returns.name) {
            returnedUser.firstName = returns.name.split(" ")[0];
            returnedUser.lastName = returns.name.split(" ")[1];
          }
          return returnedUser;
        },
      });
    }

    testTransformInsertion() {
      expect(this.transformInsertion(insertedUser1)).toEqual(userRow1);

      expect(this.transformInsertion([insertedUser1, insertedUser2])).toEqual([
        userRow1,
        userRow2,
      ]);

      ignore("detects transformInsertion type errors", () => {
        const user = User.create(0, userObject1);

        // @ts-expect-error - incorrect input type
        this.transformInsertion(user);
        // @ts-expect-error - incorrect input type
        this.transformInsertion([user]);
        // @ts-expect-error - incorrect input type
        this.transformInsertion(userObjectWithID);
        // @ts-expect-error - incorrect input type
        this.transformInsertion([userObjectWithID]);
        // @ts-expect-error - incorrect output type
        this.transformInsertion(insertedUser1).firstName;
        // @ts-expect-error - incorrect output type
        this.transformInsertion([insertedUser1])[0].firstName;
      });
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

    testTransformUpdate() {
      expect(this.transformUpdate(updatedUser1)).toEqual(userRow1);

      expect(this.transformUpdate([updatedUser1, updatedUser2])).toEqual([
        userRow1,
        userRow2,
      ]);

      ignore("detects transformUpdate type errors", () => {
        const user = User.create(0, userObject1);

        // @ts-expect-error - incorrect input type
        this.transformUpdate(user);
        // @ts-expect-error - incorrect input type
        this.transformUpdate([user]);
        // @ts-expect-error - incorrect input type
        this.transformUpdate(userObjectWithID);
        // @ts-expect-error - incorrect input type
        this.transformUpdate([userObjectWithID]);
        // @ts-expect-error - incorrect output type
        this.transformUpdate(updatedUser1).firstName;
        // @ts-expect-error - incorrect output type
        this.transformUpdate([updatedUser1])[0].firstName;
      });
    }

    testTransformInsertReturn() {
      expect(this.transformInsertReturn(insertedUser1, { id: 1 })).toEqual(
        insertReturnedUser1
      );

      expect(
        this.transformInsertReturn(
          [insertedUser1, insertedUser2],
          [{ id: 1 }, { id: 2 }]
        )
      ).toEqual([insertReturnedUser1, insertReturnedUser2]);

      ignore("detects transformInsertReturn type errors", () => {
        const user = User.create(0, userObject1);

        // @ts-expect-error - incorrect input type
        this.transformInsertReturn(user, { id: 1 });
        // @ts-expect-error - incorrect input type
        this.transformInsertReturn([user], [{ id: 1 }]);
        // @ts-expect-error - incorrect input type
        this.transformInsertReturn(userObjectWithID, { id: 1 });
        // @ts-expect-error - incorrect input type
        this.transformInsertReturn([userObjectWithID], [{ id: 1 }]);
        // @ts-expect-error - incorrect input type
        this.transformInsertReturn(selectedUser1, { id: 1 });
        // @ts-expect-error - incorrect input type
        this.transformInsertReturn([selectedUser1], [{ id: 1 }]);
        // @ts-expect-error - incorrect output type
        this.transformInsertReturn(insertedUser1, { id: 1 }).name;
        // @ts-expect-error - incorrect output type
        this.transformInsertReturn([insertedUser1], [{ id: 1 }])[0].name;
      });
    }

    testTransformUpdateReturn() {
      expect(this.transformUpdateReturn(updatedUser1, [{ id: 1 }])).toEqual([
        ReturnedUser.create(1, userObject1),
      ]);
      expect(
        this.transformUpdateReturn(updatedUser1, [{ id: 1 }, { id: 2 }])
      ).toEqual([
        ReturnedUser.create(1, userObject1),
        ReturnedUser.create(2, userObject1),
      ]);

      ignore("detects transformUpdateReturn type errors", () => {
        const user = User.create(0, userObject1);

        // @ts-expect-error - incorrect input type
        this.transformUpdateReturn(user, [{ id: 1 }]);
        // @ts-expect-error - incorrect input type
        this.transformUpdateReturn(userObjectWithID, [{ id: 1 }]);
        // @ts-expect-error - incorrect input type
        this.transformUpdateReturn(selectedUser1, [{ id: 1 }]);
        // @ts-expect-error - incorrect output type
        this.transformUpdateReturn(updatedUser1, [{ id: 1 }])[0].name;
      });
    }
  }
  const testTransformFacet = new TestTransformFacet(db);

  it("transforms insertions", () => {
    testPassThruFacet.testTransformInsertion();
    testTransformFacet.testTransformInsertion();
  });

  it("transforms selections", () => {
    testPassThruFacet.testTransformSelection();
    testTransformFacet.testTransformSelection();
  });

  it("transforms updates", () => {
    testPassThruFacet.testTransformUpdate();
    testTransformFacet.testTransformUpdate();
  });

  it("transforms insert returns", () => {
    testPassThruFacet.testTransformInsertReturn();
    testTransformFacet.testTransformInsertReturn();
  });

  it("transforms update returns", () => {
    testPassThruFacet.testTransformUpdateReturn();
    testTransformFacet.testTransformUpdateReturn();
  });
});

ignore("detects invalid return column configurations", () => {
  new KyselyFacet<
    Database,
    "users",
    Selectable<Users>,
    Insertable<Users>,
    Partial<Insertable<Users>>,
    ["id"]
    // @ts-expect-error - invalid return column configuration
  >(db, "users", { returnColumns: ["notThere"] });

  new KyselyFacet<
    Database,
    "users",
    Selectable<Users>,
    Insertable<Users>,
    Partial<Insertable<Users>>,
    // @ts-expect-error - invalid return column configuration
    ["notThere"]
  >(db, "users", {});

  new KyselyFacet<
    Database,
    "users",
    Selectable<Users>,
    Insertable<Users>,
    Partial<Insertable<Users>>,
    // @ts-expect-error - invalid return column configuration
    ["notThere", "*"]
  >(db, "users", {});

  new KyselyFacet<
    Database,
    "users",
    Selectable<Users>,
    Insertable<Users>,
    Partial<Insertable<Users>>,
    ["id"]
    // @ts-expect-error - invalid return column configuration
  >(db, "users", { returnColumns: [""] });

  new KyselyFacet<
    Database,
    "users",
    Selectable<Users>,
    Insertable<Users>,
    Partial<Insertable<Users>>,
    ["id"]
    // @ts-expect-error - invalid return column configuration
  >(db, "users", { returnColumns: ["notThere"] });

  class TestFacet6<
    // Be sure the following is the same as in KyselyFacet
    ReturnColumns extends (keyof Selectable<Users> & string)[] | ["*"] = []
  > extends KyselyFacet<
    Database,
    "users",
    Selectable<Users>,
    Insertable<Users>,
    Partial<Insertable<Users>>,
    ReturnColumns
  > {}
  // @ts-expect-error - invalid return column configuration
  new TestFacet6(db, "users", { returnColumns: ["notThere"] });
});
