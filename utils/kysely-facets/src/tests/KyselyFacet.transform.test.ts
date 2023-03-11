import { Kysely, Selectable } from "kysely";

import { KyselyFacet } from "../..";
import { createDB, resetDB, destroyDB } from "./utils/test-setup";
import { Database, Users } from "./utils/test-tables";
import {
  userRow1,
  userRow2,
  selectedUser1,
  selectedUser2,
  userRow3,
  selectedUser3,
} from "./utils/test-objects";
import { SelectedUser } from "./utils/test-types";
import { ignore } from "@fieldzoo/testing-utils";
import { StdUserFacet } from "./utils/test-facets";

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
let stdUserFacet: StdUserFacet;

beforeAll(async () => {
  db = await createDB();
  stdUserFacet = new StdUserFacet(db);
});
beforeEach(() => resetDB(db));
afterAll(() => destroyDB(db));

describe("transforms selection objects", () => {
  class TestPassThruFacet extends KyselyFacet<Database, "users"> {
    constructor(db: Kysely<Database>) {
      super(db, "users");
    }

    testTransformSelection() {
      const user1 = { id: 1, ...userRow1 };
      const user2 = { id: 2, ...userRow2 };

      expect(this.transformSelection(user1)).toEqual(user1);
      expect(this.transformSelectionArray([user1, user2])).toEqual([
        user1,
        user2,
      ]);
    }
  }
  const testPassThruFacet = new TestPassThruFacet(db);

  class TestTransformFacet extends KyselyFacet<
    Database,
    "users",
    SelectedUser
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
      });
    }

    testTransformSelection() {
      expect(this.transformSelection({ id: 1, ...userRow1 })).toEqual(
        selectedUser1
      );

      expect(
        this.transformSelectionArray([
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

  it("internally transforms selections", () => {
    testPassThruFacet.testTransformSelection();
    testTransformFacet.testTransformSelection();
  });

  it("transforms selected objects", async () => {
    const testTransformFacet = new TestTransformFacet(db);

    await stdUserFacet.insert(userRow1);
    const user = await testTransformFacet.selectOne({});
    expect(user).toEqual(selectedUser1);

    await stdUserFacet.insert([userRow2, userRow3]);
    const users = await testTransformFacet.selectMany((qb) => qb.orderBy("id"));
    expect(users).toEqual([selectedUser1, selectedUser2, selectedUser3]);
  });

  ignore("detects selected object type errors", async () => {
    const testTransformFacet = new TestTransformFacet(db);

    // @ts-expect-error - only returns transformed selection
    (await testTransformFacet.selectOne({})).name;
  });
});
