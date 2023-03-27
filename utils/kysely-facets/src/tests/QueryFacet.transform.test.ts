import { Kysely, Selectable } from "kysely";

import { QueryFacet } from "../facets/QueryFacet";
import { createDB, resetDB, destroyDB } from "./utils/test-setup";
import { Database, Users } from "./utils/test-tables";
import {
  userRow1,
  userRow2,
  selectedUser1,
  selectedUser2,
  userRow3,
  selectedUser3,
  POSTS,
} from "./utils/test-objects";
import { SelectedUser } from "./utils/test-types";
import { ignore } from "./utils/test-utils";
import { UserTableFacetReturningID } from "./utils/test-facets";
import { EmptyObject } from "../lib/type-utils";

let db: Kysely<Database>;
let userTableFacet: UserTableFacetReturningID;

beforeAll(async () => {
  db = await createDB();
  userTableFacet = new UserTableFacetReturningID(db);
});
beforeEach(() => resetDB(db));
afterAll(() => destroyDB(db));

describe("transforms selection objects", () => {
  class TestPassThruFacet extends QueryFacet<
    Database,
    "users",
    EmptyObject,
    [],
    Partial<Selectable<Users>>
  > {
    constructor(db: Kysely<Database>) {
      // TODO: revisit this cast
      super(db, db.selectFrom("users") as any);
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

  class TestTransformSingleTableFacet extends QueryFacet<
    Database,
    "users",
    EmptyObject,
    [],
    SelectedUser
  > {
    constructor(db: Kysely<Database>) {
      super(db, db.selectFrom("users"), {
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

  it("internally transforms selections", () => {
    const testPassThruFacet = new TestPassThruFacet(db);
    testPassThruFacet.testTransformSelection();

    const testTransformFacet = new TestTransformSingleTableFacet(db);
    testTransformFacet.testTransformSelection();
  });

  it("transforms selected single-table objects", async () => {
    const testTransformFacet = new TestTransformSingleTableFacet(db);

    await userTableFacet.insert(userRow1);
    const user = await testTransformFacet.selectOne({});
    expect(user).toEqual(selectedUser1);

    await userTableFacet.insert([userRow2, userRow3]);
    const users = await testTransformFacet.selectMany((qb) => qb.orderBy("id"));
    expect(users).toEqual([selectedUser1, selectedUser2, selectedUser3]);
  });

  it("transforms selected multi-table objects", async () => {
    class SelectedUserPost {
      constructor(
        public postId: number,
        public title: string,
        public userId: number,
        public handle: string
      ) {}
    }
    const testTransformFacet = new QueryFacet(
      db,
      db.selectFrom("users").innerJoin("posts", "users.id", "posts.userId"),
      {
        columnAliases: ["posts.id as postId"],
        selectTransform: (source) =>
          new SelectedUserPost(
            source.postId,
            source.title,
            source.userId,
            source.handle
          ),
      }
    );

    const insertReturn = await userTableFacet.insert(userRow1);
    const post0 = Object.assign({}, POSTS[0], { userId: insertReturn.id });
    const postId = (await db
      .insertInto("posts")
      .values(post0)
      .returning("id")
      .executeTakeFirst())!;
    const userPost = await testTransformFacet.selectOne({});

    expect(userPost).toEqual(
      new SelectedUserPost(
        postId.id,
        post0.title,
        insertReturn.id,
        userRow1.handle
      )
    );
  });

  ignore("detects selected object type errors", async () => {
    const testTransformFacet = new TestTransformSingleTableFacet(db);

    // @ts-expect-error - only returns transformed selection
    (await testTransformFacet.selectOne({})).name;
  });
});
