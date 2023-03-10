import { Insertable, Kysely, Selectable } from "kysely";

import { StandardFacet } from "../..";
import { createDB, resetDB, destroyDB } from "./utils/test-setup";
import { Database, Users } from "./utils/test-tables";
import {
  userRow1,
  userRow2,
  userObject1,
  selectedUser1,
  insertedUser1,
  insertedUser2,
  insertReturnedUser1,
  insertReturnedUser2,
} from "./utils/test-objects";
import {
  User,
  SelectedUser,
  InsertedUser,
  UpdatedUser,
  ReturnedUser,
} from "./utils/test-types";
import { ignore } from "@fieldzoo/testing-utils";

export class PlainUserFacet extends StandardFacet<
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

const userObjectWithID = { id: 1, ...userObject1 };
const updaterUser1 = UpdatedUser.create(0, userObject1);

let db: Kysely<Database>;

beforeAll(async () => {
  db = await createDB();
});
beforeEach(() => resetDB(db));
afterAll(() => destroyDB(db));

describe("transforms between inputs and outputs", () => {
  class TestPassThruFacet extends StandardFacet<Database, "users"> {
    constructor(db: Kysely<Database>) {
      super(db, "users");
    }

    testTransformInsertion() {
      expect(this.transformInsertion(userRow1)).toEqual(userRow1);
      expect(this.transformInsertionArray([userRow1, userRow2])).toEqual([
        userRow1,
        userRow2,
      ]);
    }

    testTransformUpdater() {
      const user1 = { id: 1, ...userRow1 };
      expect(this.transformUpdater(user1)).toEqual(user1);
    }

    testTransformInsertReturn() {
      expect(this.transformInsertReturn(userRow1, { id: 1 })).toEqual({
        id: 1,
      });
      expect(
        this.transformInsertReturnArray(
          [userRow1, userRow2],
          [{ id: 1 }, { id: 2 }]
        )
      ).toEqual([{ id: 1 }, { id: 2 }]);
    }

    testTransformUpdaterReturn() {
      expect(this.transformUpdateReturn(userRow1, [{ id: 1 }])).toEqual([
        { id: 1 },
      ]);
      expect(
        this.transformUpdateReturn(userRow1, [{ id: 1 }, { id: 2 }])
      ).toEqual([{ id: 1 }, { id: 2 }]);
    }
  }
  const testPassThruFacet = new TestPassThruFacet(db);

  class TestTransformFacet extends StandardFacet<
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
        insertTransform: (source) => ({
          name: `${source.firstName} ${source.lastName}`,
          handle: source.handle,
          email: source.email,
        }),
        updaterTransform: (source) => ({
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
          returnedUser.id = returns.id;
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
          returnedUser.id = returns.id;
          return returnedUser;
        },
        returnColumns: ["id"],
      });
    }

    testTransformInsertion() {
      expect(this.transformInsertion(insertedUser1)).toEqual(userRow1);

      expect(
        this.transformInsertionArray([insertedUser1, insertedUser2])
      ).toEqual([userRow1, userRow2]);

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

    testTransformUpdater() {
      expect(this.transformUpdater(updaterUser1)).toEqual(userRow1);

      ignore("detects transformUpdater type errors", () => {
        const user = User.create(0, userObject1);

        // @ts-expect-error - incorrect input type
        this.transformUpdater(user);
        // @ts-expect-error - incorrect input type
        this.transformUpdater(userObjectWithID);
        // @ts-expect-error - incorrect output type
        this.transformUpdater(updaterUser1).firstName;
      });
    }

    testTransformInsertReturn() {
      expect(this.transformInsertReturn(insertedUser1, { id: 1 })).toEqual(
        insertReturnedUser1
      );

      expect(
        this.transformInsertReturnArray(
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

    testTransformUpdaterReturn() {
      expect(this.transformUpdateReturn(updaterUser1, [{ id: 1 }])).toEqual([
        ReturnedUser.create(1, userObject1),
      ]);
      expect(
        this.transformUpdateReturn(updaterUser1, [{ id: 1 }, { id: 2 }])
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
        this.transformUpdateReturn(updaterUser1, [{ id: 1 }])[0].name;
      });
    }
  }
  const testTransformFacet = new TestTransformFacet(db);

  it("transforms insertions", () => {
    testPassThruFacet.testTransformInsertion();
    testTransformFacet.testTransformInsertion();
  });

  it("transforms updates", () => {
    testPassThruFacet.testTransformUpdater();
    testTransformFacet.testTransformUpdater();
  });

  it("transforms insert returns", () => {
    testPassThruFacet.testTransformInsertReturn();
    testTransformFacet.testTransformInsertReturn();
  });

  it("transforms update returns", () => {
    testPassThruFacet.testTransformUpdaterReturn();
    testTransformFacet.testTransformUpdaterReturn();
  });
});

ignore("detects invalid return column configurations", () => {
  new StandardFacet<
    Database,
    "users",
    Selectable<Users>,
    Insertable<Users>,
    Partial<Insertable<Users>>,
    ["id"]
    // @ts-expect-error - invalid return column configuration
  >(db, "users", { returnColumns: ["notThere"] });

  new StandardFacet<
    Database,
    "users",
    Selectable<Users>,
    Insertable<Users>,
    Partial<Insertable<Users>>,
    // @ts-expect-error - invalid return column configuration
    ["notThere"]
  >(db, "users", {});

  new StandardFacet<
    Database,
    "users",
    Selectable<Users>,
    Insertable<Users>,
    Partial<Insertable<Users>>,
    // @ts-expect-error - invalid return column configuration
    ["notThere", "*"]
  >(db, "users", {});

  new StandardFacet<
    Database,
    "users",
    Selectable<Users>,
    Insertable<Users>,
    Partial<Insertable<Users>>,
    ["id"]
    // @ts-expect-error - invalid return column configuration
  >(db, "users", { returnColumns: [""] });

  new StandardFacet<
    Database,
    "users",
    Selectable<Users>,
    Insertable<Users>,
    Partial<Insertable<Users>>,
    ["id"]
    // @ts-expect-error - invalid return column configuration
  >(db, "users", { returnColumns: ["notThere"] });

  class TestFacet6<
    // Be sure the following is the same as in StandardFacet
    ReturnColumns extends (keyof Selectable<Users> & string)[] | ["*"] = []
  > extends StandardFacet<
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
