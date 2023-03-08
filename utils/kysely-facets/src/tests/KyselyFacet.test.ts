import { Kysely } from "kysely";

import { KyselyFacet } from "../..";
import { createDB, resetDB, destroyDB } from "./utils/test-setup";
import { Database } from "./utils/test-tables";
import { PassThruUserFacet } from "./utils/test-facets";
import { USERS } from "./utils/test-objects";
import {
  User,
  SelectedUser,
  InsertedUser,
  UpdatedUser,
  InsertReturnedUser,
  UpdateReturnedUser,
} from "./utils/test-types";
import { ignore } from "@fieldzoo/testing-utils";

let db: Kysely<Database>;
let plainUserFacet: PassThruUserFacet;

beforeAll(async () => {
  db = await createDB();
  plainUserFacet = new PassThruUserFacet(db);
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
    const readUser0 = await plainUserFacet.selectById(user0.id);
    expect(readUser0?.handle).toEqual(USERS[0].handle);
    const noUser = await plainUserFacet.selectById(user1.id);
    expect(noUser).toBeNull();
  });
});

describe("transforms between inputs and outputs", () => {
  class TestPassThruFacet extends KyselyFacet<Database, "users"> {
    constructor(db: Kysely<Database>) {
      super(db, "users");
    }

    testTransformInsertion() {
      const john = {
        name: "John Smith",
        handle: "jsmith",
        email: "jsmith@bar.baz",
      };
      const jane = {
        name: "Jane Doe",
        handle: "jdoe",
        email: "jdoe@bar.baz",
      };

      expect(this.transformInsertion(john)).toEqual(john);
      expect(this.transformInsertion([john, jane])).toEqual([john, jane]);
    }

    testTransformSelection() {
      const john = {
        id: 1,
        name: "John Smith",
        handle: "jsmith",
        email: "jsmith@bar.baz",
      };
      const jane = {
        id: 2,
        name: "Jane Doe",
        handle: "jdoe",
        email: "jdoe@bar.baz",
      };

      expect(this.transformSelection(john)).toEqual(john);
      expect(this.transformSelection([john, jane])).toEqual([john, jane]);
    }

    testTransformUpdate() {
      const john = {
        id: 1,
        name: "John Smith",
        handle: "jsmith",
        email: "jsmith@bar.baz",
      };
      const jane = {
        id: 2,
        name: "Jane Doe",
        handle: "jdoe",
        email: "jdoe@bar.baz",
      };

      expect(this.transformUpdate(john)).toEqual(john);
      expect(this.transformUpdate([john, jane])).toEqual([john, jane]);
    }

    testTransformInsertReturn() {
      const john = {
        name: "John Smith",
        handle: "jsmith",
        email: "jsmith@bar.baz",
      };
      const jane = {
        name: "Jane Doe",
        handle: "jdoe",
        email: "jdoe@bar.baz",
      };

      expect(this.transformInsertReturn(john, { id: 1 })).toEqual({ id: 1 });
      expect(
        this.transformInsertReturn([john, jane], [{ id: 1 }, { id: 2 }])
      ).toEqual([{ id: 1 }, { id: 2 }]);
    }

    testTransformUpdateReturn() {
      const john = {
        name: "John Smith",
        handle: "jsmith",
        email: "jsmith@bar.baz",
      };

      expect(this.transformUpdateReturn(john, [{ id: 1 }])).toEqual([
        { id: 1 },
      ]);
      expect(this.transformUpdateReturn(john, [{ id: 1 }, { id: 2 }])).toEqual([
        { id: 1 },
        { id: 2 },
      ]);
    }
  }
  const testPassThruFacet = new TestPassThruFacet(db);

  class TestTransformFacet extends KyselyFacet<
    Database,
    "users",
    SelectedUser,
    InsertedUser,
    UpdatedUser,
    InsertReturnedUser,
    UpdateReturnedUser
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
          const returnedUser = new InsertReturnedUser(
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
          const returnedUser = new UpdateReturnedUser(
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
      expect(
        this.transformInsertion(
          new InsertedUser(0, "John", "Smith", "jsmith", "jsmith@bar.baz")
        )
      ).toEqual({
        name: "John Smith",
        handle: "jsmith",
        email: "jsmith@bar.baz",
      });

      expect(
        this.transformInsertion([
          new InsertedUser(0, "John", "Smith", "jsmith", "jsmith@bar.baz"),
          new InsertedUser(0, "Jane", "Doe", "jdoe", "jdoe@bar.baz"),
        ])
      ).toEqual([
        {
          name: "John Smith",
          handle: "jsmith",
          email: "jsmith@bar.baz",
        },
        {
          name: "Jane Doe",
          handle: "jdoe",
          email: "jdoe@bar.baz",
        },
      ]);

      ignore("detects transformInsertion type errors", () => {
        const userObj = {
          id: 1,
          firstName: "John",
          lastName: "Smith",
          handle: "jsmith",
          email: "jsmith@bar.baz",
        };
        const user = new User(0, "John", "Smith", "jsmith", "jsmith@bar.baz");
        const insertReturn = new InsertedUser(
          0,
          "John",
          "Smith",
          "jsmith",
          "jsmith@bar.baz"
        );

        // @ts-expect-error - incorrect input type
        this.transformInsertion(user);
        // @ts-expect-error - incorrect input type
        this.transformInsertion([user]);
        // @ts-expect-error - incorrect input type
        this.transformInsertion(userObj);
        // @ts-expect-error - incorrect input type
        this.transformInsertion([userObj]);
        // @ts-expect-error - incorrect output type
        this.transformInsertion(insertReturn).firstName;
        // @ts-expect-error - incorrect output type
        this.transformInsertion([insertReturn])[0].firstName;
      });
    }

    testTransformSelection() {
      expect(
        this.transformSelection({
          id: 1,
          name: "John Smith",
          handle: "jsmith",
          email: "jsmith@bar.baz",
        })
      ).toEqual(
        new SelectedUser(1, "John", "Smith", "jsmith", "jsmith@bar.baz")
      );

      expect(
        this.transformSelection([
          {
            id: 1,
            name: "John Smith",
            handle: "jsmith",
            email: "jsmith@bar.baz",
          },
          {
            id: 2,
            name: "Jane Doe",
            handle: "jdoe",
            email: "jdoe@bar.baz",
          },
        ])
      ).toEqual([
        new SelectedUser(1, "John", "Smith", "jsmith", "jsmith@bar.baz"),
        new SelectedUser(2, "Jane", "Doe", "jdoe", "jdoe@bar.baz"),
      ]);

      ignore("detects transformSelection type errors", () => {
        const userObj = {
          id: 1,
          name: "John Smih",
          handle: "jsmith",
          email: "jsmith@bar.baz",
        };

        // @ts-expect-error - incorrect output type
        this.transformSelection(userObj).name;
        // @ts-expect-error - incorrect output type
        this.transformSelection([userObj])[0].name;
      });
    }

    testTransformUpdate() {
      expect(
        this.transformUpdate(
          new UpdatedUser(0, "John", "Smith", "jsmith", "jsmith@bar.baz")
        )
      ).toEqual({
        name: "John Smith",
        handle: "jsmith",
        email: "jsmith@bar.baz",
      });

      expect(
        this.transformUpdate([
          new UpdatedUser(0, "John", "Smith", "jsmith", "jsmith@bar.baz"),
          new UpdatedUser(0, "Jane", "Doe", "jdoe", "jdoe@bar.baz"),
        ])
      ).toEqual([
        {
          name: "John Smith",
          handle: "jsmith",
          email: "jsmith@bar.baz",
        },
        {
          name: "Jane Doe",
          handle: "jdoe",
          email: "jdoe@bar.baz",
        },
      ]);

      ignore("detects transformUpdate type errors", () => {
        const userObj = {
          id: 1,
          firstName: "John",
          lastName: "Smith",
          handle: "jsmith",
          email: "jsmith@bar.baz",
        };
        const user = new User(0, "John", "Smith", "jsmith", "jsmith@bar.baz");
        const updatedUser = new UpdatedUser(
          0,
          "John",
          "Smith",
          "jsmith",
          "jsmith@bar.baz"
        );

        // @ts-expect-error - incorrect input type
        this.transformUpdate(user);
        // @ts-expect-error - incorrect input type
        this.transformUpdate([user]);
        // @ts-expect-error - incorrect input type
        this.transformUpdate(userObj);
        // @ts-expect-error - incorrect input type
        this.transformUpdate([userObj]);
        // @ts-expect-error - incorrect output type
        this.transformUpdate(updatedUser).firstName;
        // @ts-expect-error - incorrect output type
        this.transformUpdate([updatedUser])[0].firstName;
      });
    }

    testTransformInsertReturn() {
      expect(
        this.transformInsertReturn(
          new InsertedUser(0, "John", "Smith", "jsmith", "jsmith@bar.baz"),
          { id: 1 }
        )
      ).toEqual(
        new InsertReturnedUser(1, "John", "Smith", "jsmith", "jsmith@bar.baz")
      );

      expect(
        this.transformInsertReturn(
          [
            new InsertedUser(0, "John", "Smith", "jsmith", "jsmith@bar.baz"),
            new InsertedUser(0, "Jane", "Doe", "jdoe", "jdoe@bar.baz"),
          ],
          [{ id: 1 }, { id: 2 }]
        )
      ).toEqual([
        new InsertReturnedUser(1, "John", "Smith", "jsmith", "jsmith@bar.baz"),
        new InsertReturnedUser(2, "Jane", "Doe", "jdoe", "jdoe@bar.baz"),
      ]);

      ignore("detects transformInsertReturn type errors", () => {
        const userObj = {
          id: 1,
          firstName: "John",
          lastName: "Smith",
          handle: "jsmith",
          email: "jsmith@bar.baz",
        };
        const user = new User(0, "John", "Smith", "jsmith", "jsmith@bar.baz");
        const insertReturn = new InsertedUser(
          0,
          "John",
          "Smith",
          "jsmith",
          "jsmith@bar.baz"
        );
        const selectedUser = new SelectedUser(
          0,
          "John",
          "Smith",
          "jsmith",
          "jsmith@bar.baz"
        );

        // @ts-expect-error - incorrect input type
        this.transformInsertReturn(user, { id: 1 });
        // @ts-expect-error - incorrect input type
        this.transformInsertReturn([user], [{ id: 1 }]);
        // @ts-expect-error - incorrect input type
        this.transformInsertReturn(userObj, { id: 1 });
        // @ts-expect-error - incorrect input type
        this.transformInsertReturn([userObj], [{ id: 1 }]);
        // @ts-expect-error - incorrect input type
        this.transformInsertReturn(selectedUser, { id: 1 });
        // @ts-expect-error - incorrect input type
        this.transformInsertReturn([selectedUser], [{ id: 1 }]);
        // @ts-expect-error - incorrect output type
        this.transformInsertReturn(insertReturn, { id: 1 }).name;
        // @ts-expect-error - incorrect output type
        this.transformInsertReturn([insertReturn], [{ id: 1 }])[0].name;
      });
    }

    testTransformUpdateReturn() {
      expect(
        this.transformUpdateReturn(
          new UpdatedUser(0, "John", "Smith", "jsmith", "jsmith@bar.baz"),
          [{ id: 1 }]
        )
      ).toEqual([
        new UpdateReturnedUser(1, "John", "Smith", "jsmith", "jsmith@bar.baz"),
      ]);
      expect(
        this.transformUpdateReturn(
          new UpdatedUser(0, "John", "Smith", "jsmith", "jsmith@bar.baz"),
          [{ id: 1 }, { id: 2 }]
        )
      ).toEqual([
        new UpdateReturnedUser(1, "John", "Smith", "jsmith", "jsmith@bar.baz"),
        new UpdateReturnedUser(2, "John", "Smith", "jsmith", "jsmith@bar.baz"),
      ]);

      ignore("detects transformUpdateReturn type errors", () => {
        const userObj = {
          id: 1,
          firstName: "John",
          lastName: "Smith",
          handle: "jsmith",
          email: "jsmith@bar.baz",
        };
        const user = new User(0, "John", "Smith", "jsmith", "jsmith@bar.baz");
        const updatedUser = new UpdatedUser(
          0,
          "John",
          "Smith",
          "jsmith",
          "jsmith@bar.baz"
        );
        const selectedUser = new SelectedUser(
          0,
          "John",
          "Smith",
          "jsmith",
          "jsmith@bar.baz"
        );

        // @ts-expect-error - incorrect input type
        this.transformUpdateReturn(user, [{ id: 1 }]);
        // @ts-expect-error - incorrect input type
        this.transformUpdateReturn(userObj, [{ id: 1 }]);
        // @ts-expect-error - incorrect input type
        this.transformUpdateReturn(selectedUser, [{ id: 1 }]);
        // @ts-expect-error - incorrect output type
        this.transformUpdateReturn(updatedUser, [{ id: 1 }])[0].name;
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
