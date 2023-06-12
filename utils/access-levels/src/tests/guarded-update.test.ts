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

describe("AccessLevelTable guarded update", () => {
  it("directly updates the resource table", async () => {
    // make sure values start null

    const posts = await intKeyDB.selectFrom("posts").selectAll().execute();
    expect(posts).toHaveLength(3);
    for (const post of posts) {
      expect(post.value).toBeNull();
    }

    // updated all readable values

    await intKeyAccessLevelTable
      .guardQuery(
        intKeyDB,
        AccessLevel.Read,
        1 as UserID,
        intKeyDB.updateTable("posts").set({ value: "foo" })
      )
      .execute();

    let updatedPosts = await intKeyDB
      .selectFrom("posts")
      .select(["posts.postID", "posts.value"])
      .execute();
    updatedPosts.sort((a, b) => a.postID - b.postID);
    expect(updatedPosts).toEqual([
      { postID: 1, value: "foo" },
      { postID: 2, value: "foo" },
      { postID: 3, value: null },
    ]);

    // update all writeable values

    await intKeyAccessLevelTable
      .guardQuery(
        intKeyDB,
        AccessLevel.Write,
        1 as UserID,
        intKeyDB.updateTable("posts").set({ value: "bar" })
      )
      .execute();

    updatedPosts = await intKeyDB
      .selectFrom("posts")
      .select(["posts.postID", "posts.value"])
      .execute();
    updatedPosts.sort((a, b) => a.postID - b.postID);
    expect(updatedPosts).toEqual([
      { postID: 1, value: "bar" },
      { postID: 2, value: "foo" },
      { postID: 3, value: null },
    ]);
  });

  it("indirectly updates the referenced table", async () => {
    // make sure values start null

    const comments = await intKeyDB
      .selectFrom("comments")
      .selectAll()
      .execute();
    expect(comments).toHaveLength(3);
    for (const comment of comments) {
      expect(comment.value).toBeNull();
    }

    // updated all readable values

    await intKeyAccessLevelTable
      .guardQuery(
        intKeyDB,
        AccessLevel.Read,
        1 as UserID,
        intKeyDB
          .updateTable("comments")
          .set({ value: "foo" })
          // TODO: user shouldn't have to know to do this
          .from("posts")
          .whereRef("comments.postID", "=", "posts.postID")
      )
      .execute();

    let updatedComments = await intKeyDB
      .selectFrom("comments")
      .select(["comments.commentID", "comments.value"])
      .execute();
    updatedComments.sort((a, b) => a.commentID - b.commentID);
    expect(updatedComments).toEqual([
      { commentID: 1, value: "foo" },
      { commentID: 2, value: "foo" },
      { commentID: 3, value: null },
    ]);

    // update all writeable values

    await intKeyAccessLevelTable
      .guardQuery(
        intKeyDB,
        AccessLevel.Write,
        1 as UserID,
        intKeyDB
          .updateTable("comments")
          .set({ value: "bar" })
          // TODO: user shouldn't have to know to do this
          .from("posts")
          .whereRef("comments.postID", "=", "posts.postID")
      )
      .execute();

    updatedComments = await intKeyDB
      .selectFrom("comments")
      .select(["comments.commentID", "comments.value"])
      .execute();
    updatedComments.sort((a, b) => a.commentID - b.commentID);
    expect(updatedComments).toEqual([
      { commentID: 1, value: "bar" },
      { commentID: 2, value: "foo" },
      { commentID: 3, value: null },
    ]);

    // make sure posts value didn't change

    const postValues = await intKeyDB
      .selectFrom("posts")
      .select(["posts.value"])
      .execute();
    expect(postValues).toEqual([
      { value: null },
      { value: null },
      { value: null },
    ]);
  });
});
