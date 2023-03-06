import { Kysely } from "kysely";

import { createDB, resetDB, destroyDB } from "./utils/test-setup";
import { Database, UserTable } from "./utils/test-tables";
import { USERS } from "./utils/test-objects";
import { KyselyFacet } from "../..";

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
    User,
    User,
    User,
    User
  > {
    constructor(db: Kysely<Database>) {
      super(db, "users", {
        selectTransform: (source) =>
          new User(
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
          const returnedUser = new User(
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
          new User(0, "John", "Smith", "jsmith", "jsmith@bar.baz")
        )
      ).toEqual({
        name: "John Smith",
        handle: "jsmith",
        email: "jsmith@bar.baz",
      });

      expect(
        this.transformInsertion([
          new User(0, "John", "Smith", "jsmith", "jsmith@bar.baz"),
          new User(0, "Jane", "Doe", "jdoe", "jdoe@bar.baz"),
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
    }

    testTransformSelection() {
      expect(
        this.transformSelection({
          id: 1,
          name: "John Smith",
          handle: "jsmith",
          email: "jsmith@bar.baz",
        })
      ).toEqual(new User(1, "John", "Smith", "jsmith", "jsmith@bar.baz"));

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
        new User(1, "John", "Smith", "jsmith", "jsmith@bar.baz"),
        new User(2, "Jane", "Doe", "jdoe", "jdoe@bar.baz"),
      ]);
    }

    testTransformUpdate() {
      expect(
        this.transformUpdate(
          new User(0, "John", "Smith", "jsmith", "jsmith@bar.baz")
        )
      ).toEqual({
        name: "John Smith",
        handle: "jsmith",
        email: "jsmith@bar.baz",
      });

      expect(
        this.transformUpdate([
          new User(0, "John", "Smith", "jsmith", "jsmith@bar.baz"),
          new User(0, "Jane", "Doe", "jdoe", "jdoe@bar.baz"),
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
    }

    testTransformReturn() {
      expect(
        this.transformReturn(
          new User(0, "John", "Smith", "jsmith", "jsmith@bar.baz"),
          { id: 1 }
        )
      ).toEqual(new User(1, "John", "Smith", "jsmith", "jsmith@bar.baz"));

      expect(
        this.transformReturn(
          [
            new User(0, "John", "Smith", "jsmith", "jsmith@bar.baz"),
            new User(0, "Jane", "Doe", "jdoe", "jdoe@bar.baz"),
          ],
          [{ id: 1 }, { id: 2 }]
        )
      ).toEqual([
        new User(1, "John", "Smith", "jsmith", "jsmith@bar.baz"),
        new User(2, "Jane", "Doe", "jdoe", "jdoe@bar.baz"),
      ]);
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
