import { Kysely } from "kysely";

import {
  IntKeyDB,
  createIntKeyDB,
  getIntKeyAccessLevelTable,
} from "./lib/intkey-tables";
import { AccessLevel, createDatabase, destroyDB } from "./lib/test-util";

type UserID = number & { readonly __brand: unique symbol };
type PostID = number & { readonly __brand: unique symbol };

let intKeyDB: Kysely<IntKeyDB>;
const intKeyAccessLevelTable = getIntKeyAccessLevelTable();

beforeAll(async () => {
  await createDatabase();
});

beforeEach(async () => {
  intKeyDB = await createIntKeyDB();
  await intKeyAccessLevelTable.create(intKeyDB);

  // user1 owns post 1, has read access to post 2, and no access to post 3
  await intKeyDB
    .insertInto("users")
    .values([
      { handle: "user1", name: "User 1" },
      { handle: "user2", name: "User 2" },
    ])
    .execute();
  await intKeyDB
    .insertInto("posts")
    .values([
      { ownerID: 1, title: "Post 1" },
      { ownerID: 2, title: "Post 2" },
      { ownerID: 2, title: "Post 3" },
    ])
    .execute();
  await intKeyDB
    .insertInto("comments")
    .values([
      { postID: 1, comment: "Comment 1" },
      { postID: 2, comment: "Comment 2" },
      { postID: 3, comment: "Comment 3" },
    ])
    .execute();
  await intKeyAccessLevelTable.setAccessLevel(
    intKeyDB,
    1 as UserID,
    2 as PostID,
    AccessLevel.Read
  );
});

afterEach(async () => {
  if (intKeyDB) {
    await intKeyAccessLevelTable.drop(intKeyDB);
    await destroyDB(intKeyDB);
    intKeyDB = undefined as any;
  }
});

describe("AccessLevelTable guarded delete", () => {
  // TODO: choose better parenthesized qualifier
  it("directly delete rows in the resource table (all accessible)", async () => {
    const posts1 = await intKeyDB.selectFrom("posts").selectAll().execute();
    expect(posts1).toHaveLength(3);

    await intKeyAccessLevelTable
      .guardQuery(
        intKeyDB,
        AccessLevel.Read,
        1 as UserID,
        intKeyDB.deleteFrom("posts")
      )
      .execute();

    const posts2 = await intKeyDB
      .selectFrom("posts")
      // TODO: is the qualifier necessary? If so, document or enforce.
      .select("posts.postID")
      .execute();
    expect(posts2).toEqual([{ postID: 3 }]);
  });

  it("directly delete rows in the resource table (some accessible)", async () => {
    const posts1 = await intKeyDB.selectFrom("posts").selectAll().execute();
    expect(posts1).toHaveLength(3);

    await intKeyAccessLevelTable
      .guardQuery(
        intKeyDB,
        AccessLevel.Write,
        1 as UserID,
        intKeyDB.deleteFrom("posts")
      )
      .execute();

    const posts2 = await intKeyDB
      .selectFrom("posts")
      .select("posts.postID")
      .execute();
    posts2.sort((a, b) => a.postID - b.postID);
    expect(posts2).toEqual([{ postID: 2 }, { postID: 3 }]);
  });

  it("indirectly deletes rows in referenced table (all accessible)", async () => {
    const comments1 = await intKeyDB
      .selectFrom("comments")
      .selectAll()
      .execute();
    expect(comments1).toHaveLength(3);

    await intKeyAccessLevelTable
      .guardQuery(
        intKeyDB,
        AccessLevel.Read,
        1 as UserID,
        intKeyDB
          .deleteFrom("comments")
          // TODO: user shouldn't have to know to do this
          .using("posts")
          .whereRef("comments.postID", "=", "posts.postID")
      )
      .execute();

    const comments2 = await intKeyDB
      .selectFrom("comments")
      .select("comments.commentID")
      .execute();
    expect(comments2).toEqual([{ commentID: 3 }]);

    const posts1 = await intKeyDB.selectFrom("posts").selectAll().execute();
    expect(posts1).toHaveLength(3);
  });

  it("indirectly deletes rows in referenced table (some accessible)", async () => {
    await intKeyAccessLevelTable
      .guardQuery(
        intKeyDB,
        AccessLevel.Write,
        1 as UserID,
        intKeyDB
          .deleteFrom("comments")
          .using("posts")
          .whereRef("comments.postID", "=", "posts.postID")
      )
      .execute();

    const comments2 = await intKeyDB
      .selectFrom("comments")
      .select("comments.commentID")
      .execute();
    comments2.sort((a, b) => a.commentID - b.commentID);
    expect(comments2).toEqual([{ commentID: 2 }, { commentID: 3 }]);

    const posts1 = await intKeyDB.selectFrom("posts").selectAll().execute();
    expect(posts1).toHaveLength(3);
  });
});
