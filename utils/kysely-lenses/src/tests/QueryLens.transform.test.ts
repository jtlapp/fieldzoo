import { Kysely, Selectable } from "kysely";

import { QueryLens } from "../lenses/QueryLens";
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
import { UserTableLensReturningID } from "./utils/test-lenses";
import { EmptyObject } from "../lib/type-utils";
import { QueryModifier } from "../lib/query-filter";

let db: Kysely<Database>;
let userTableLens: UserTableLensReturningID;

beforeAll(async () => {
  db = await createDB();
  userTableLens = new UserTableLensReturningID(db);
});
beforeEach(() => resetDB(db));
afterAll(() => destroyDB(db));

describe("transforms selection objects", () => {
  class TestPassThruLens extends QueryLens<
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

  class TestTransformSingleTableLens extends QueryLens<
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
    const testPassThruLens = new TestPassThruLens(db);
    testPassThruLens.testTransformSelection();

    const testTransformLens = new TestTransformSingleTableLens(db);
    testTransformLens.testTransformSelection();
  });

  it("transforms selected single-table objects", async () => {
    const testTransformLens = new TestTransformSingleTableLens(db);

    await userTableLens.insert(userRow1);
    const user = await testTransformLens.selectOne({});
    expect(user).toEqual(selectedUser1);

    await userTableLens.insert([userRow2, userRow3]);
    const users = await testTransformLens.selectMany(
      new QueryModifier((qb) => qb.orderBy("id"))
    );
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
    const testTransformLens = new QueryLens(
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

    const insertReturn = await userTableLens.insert(userRow1);
    const post0 = Object.assign({}, POSTS[0], { userId: insertReturn.id });
    const postId = (await db
      .insertInto("posts")
      .values(post0)
      .returning("id")
      .executeTakeFirst())!;
    const userPost = await testTransformLens.selectOne({});

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
    const testTransformLens = new TestTransformSingleTableLens(db);

    // @ts-expect-error - only returns transformed selection
    (await testTransformLens.selectOne({})).name;
  });
});
