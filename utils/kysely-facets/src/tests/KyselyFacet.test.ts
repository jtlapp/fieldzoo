import { Kysely } from "kysely";

import { createDB, resetDB, destroyDB } from "./utils/test-setup";
import { Database, UserTable } from "./utils/test-tables";
import { USERS } from "./utils/test-objects";
import { KyselyFacet } from "../..";
import { ignore } from "@fieldzoo/testing-utils";

let db: Kysely<Database>;
let userTable: UserTable;

beforeAll(async () => {
  db = await createDB();
  userTable = new UserTable(db);
});
beforeEach(() => resetDB(db));
afterAll(() => destroyDB(db));

describe("basic row queries", () => {
  it("inserts, selects, updates, and deletes objects by row query", async () => {
    // Add users by row query
    const user0 = (await userTable
      .insertRows()
      .values(USERS[0])
      .returningAll()
      .executeTakeFirst())!;
    const user1 = (await userTable
      .insertRows()
      .values(USERS[1])
      .returningAll()
      .executeTakeFirst())!;

    // Update a user by row query
    const NEW_EMAIL = "new@baz.com";
    user1.email = NEW_EMAIL;
    await userTable
      .updateRows()
      .set(user1)
      .where("id", "=", user1.id)
      .execute();

    // Retrieves user by row query
    const readUser1 = await userTable
      .selectRows()
      .where("id", "=", user1.id)
      .executeTakeFirst();
    expect(readUser1?.handle).toEqual(USERS[1].handle);
    expect(readUser1?.email).toEqual(NEW_EMAIL);

    // Delete user by row query
    await userTable.deleteRows().where("id", "=", user1.id).execute();

    // Verify correct user was deleted
    const readUser0 = await userTable.selectById(user0.id);
    expect(readUser0?.handle).toEqual(USERS[0].handle);
    const noUser = await userTable.selectById(user1.id);
    expect(noUser).toBeNull();
  });
});

describe("transforms between inputs and outputs", () => {
  class User {
    constructor(
      public id: number,
      public firstName: string,
      public lastName: string,
      public handle: string,
      public email: string
    ) {}
  }
  class InsertedUser extends User {
    readonly __type = "InsertedUser";
  }
  class SelectedUser extends User {
    readonly __type = "SelectedUser";
  }
  class UpdatedUser extends User {
    readonly __type = "UpdatedUser";
  }
  class ReturnedUser extends User {
    readonly __type = "ReturnedUser";
  }

  class PassThroughFacet extends KyselyFacet<Database, "users"> {
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

    testTransformReturn() {
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

      expect(this.transformReturn(john, { id: 1 })).toEqual({ id: 1 });
      expect(
        this.transformReturn([john, jane], [{ id: 1 }, { id: 2 }])
      ).toEqual([{ id: 1 }, { id: 2 }]);
    }
  }
  const passThroughFacet = new PassThroughFacet(db);

  class TransformFacet extends KyselyFacet<
    Database,
    "users",
    SelectedUser,
    InsertedUser,
    UpdatedUser,
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
        returnTransform: (source, returns) => {
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
        const insertedUser = new InsertedUser(
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
        this.transformInsertion(insertedUser).firstName;
        // @ts-expect-error - incorrect output type
        this.transformInsertion([insertedUser])[0].firstName;
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

    testTransformReturn() {
      expect(
        this.transformReturn(
          new InsertedUser(0, "John", "Smith", "jsmith", "jsmith@bar.baz"),
          { id: 1 }
        )
      ).toEqual(
        new ReturnedUser(1, "John", "Smith", "jsmith", "jsmith@bar.baz")
      );

      expect(
        this.transformReturn(
          [
            new InsertedUser(0, "John", "Smith", "jsmith", "jsmith@bar.baz"),
            new InsertedUser(0, "Jane", "Doe", "jdoe", "jdoe@bar.baz"),
          ],
          [{ id: 1 }, { id: 2 }]
        )
      ).toEqual([
        new ReturnedUser(1, "John", "Smith", "jsmith", "jsmith@bar.baz"),
        new ReturnedUser(2, "Jane", "Doe", "jdoe", "jdoe@bar.baz"),
      ]);

      ignore("detects transformReturn type errors", () => {
        const userObj = {
          id: 1,
          firstName: "John",
          lastName: "Smith",
          handle: "jsmith",
          email: "jsmith@bar.baz",
        };
        const user = new User(0, "John", "Smith", "jsmith", "jsmith@bar.baz");
        const insertedUser = new InsertedUser(
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
        this.transformReturn(user, { id: 1 });
        // @ts-expect-error - incorrect input type
        this.transformReturn([user], [{ id: 1 }]);
        // @ts-expect-error - incorrect input type
        this.transformReturn(userObj, { id: 1 });
        // @ts-expect-error - incorrect input type
        this.transformReturn([userObj], [{ id: 1 }]);
        // @ts-expect-error - incorrect input type
        this.transformReturn(selectedUser, { id: 1 });
        // @ts-expect-error - incorrect input type
        this.transformReturn([selectedUser], [{ id: 1 }]);
        // @ts-expect-error - incorrect output type
        this.transformReturn(insertedUser, { id: 1 }).name;
        // @ts-expect-error - incorrect output type
        this.transformReturn([insertedUser], [{ id: 1 }])[0].name;
      });
    }
  }
  const transformFacet = new TransformFacet(db);

  it("transforms insertions", () => {
    passThroughFacet.testTransformInsertion();
    transformFacet.testTransformInsertion();
  });

  it("transforms selections", () => {
    passThroughFacet.testTransformSelection();
    transformFacet.testTransformSelection();
  });

  it("transforms updates", () => {
    passThroughFacet.testTransformUpdate();
    transformFacet.testTransformUpdate();
  });

  it("transforms returns", () => {
    passThroughFacet.testTransformReturn();
    transformFacet.testTransformReturn();
  });
});
