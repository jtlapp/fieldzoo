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

describe("AccessLevelTable guarded insert", () => {
  it("inserts rows referencing owned resource, returning nothing", async () => {
    const comment1 = {
      postID: 1 as PostID,
      comment: "Comment 1",
    };
    const result = await intKeyAccessLevelTable
      .guardInsert(
        intKeyDB,
        AccessLevel.Read,
        1 as UserID,
        "comments",
        comment1,
        "postID"
      )
      .executeTakeFirst();
    expect(result?.numInsertedOrUpdatedRows).toEqual(BigInt(1));

    const comments2 = await intKeyDB
      .selectFrom("comments")
      .selectAll()
      .execute();
    expect(comments2).toEqual([
      {
        commentID: 1,
        postID: 1,
        comment: "Comment 1",
        value: null,
      },
    ]);
  });

  it("inserts rows referencing owned resource, returning a column", async () => {
    const comment1 = {
      postID: 1 as PostID,
      comment: "Comment 1",
    };
    const result = await intKeyAccessLevelTable
      .guardInsert(
        intKeyDB,
        AccessLevel.Read,
        1 as UserID,
        "comments",
        comment1,
        "postID",
        "commentID"
      )
      .executeTakeFirst();
    expect(result).toEqual({ commentID: 1 });

    const comments2 = await intKeyDB
      .selectFrom("comments")
      .selectAll()
      .execute();
    expect(comments2).toEqual([
      {
        commentID: 1,
        postID: 1,
        comment: "Comment 1",
        value: null,
      },
    ]);
  });

  it("inserts rows referencing non-owned, accessible resource, returning named columns", async () => {
    const comment1 = {
      postID: 2 as PostID,
      comment: "Comment 1",
      value: "Value 1",
    };
    const result = await intKeyAccessLevelTable
      .guardInsert(
        intKeyDB,
        AccessLevel.Read,
        1 as UserID,
        "comments",
        comment1,
        "postID",
        ["commentID", "value"]
      )
      .execute();
    expect(result).toEqual([{ commentID: 1, value: "Value 1" }]);

    const comments2 = await intKeyDB
      .selectFrom("comments")
      .selectAll()
      .execute();
    expect(comments2).toEqual([
      {
        commentID: 1,
        postID: 2,
        comment: "Comment 1",
        value: "Value 1",
      },
    ]);
  });

  it("inserts rows referencing non-owned, accessible resource, returning all columns", async () => {
    const comment1 = {
      postID: 2 as PostID,
      comment: "Comment 1",
      value: "Value 1",
    };
    const result = await intKeyAccessLevelTable
      .guardInsert(
        intKeyDB,
        AccessLevel.Read,
        1 as UserID,
        "comments",
        comment1,
        "postID",
        "*"
      )
      .execute();
    expect(result).toEqual([
      {
        commentID: 1,
        postID: 2,
        comment: "Comment 1",
        value: "Value 1",
      },
    ]);

    const comments2 = await intKeyDB
      .selectFrom("comments")
      .selectAll()
      .execute();
    expect(comments2).toEqual([
      {
        commentID: 1,
        postID: 2,
        comment: "Comment 1",
        value: "Value 1",
      },
    ]);
  });

  it("does not insert rows referencing non-owned, inaccessible resource", async () => {
    const comment1 = {
      postID: 3 as PostID,
      comment: "Comment 1",
    };
    await intKeyAccessLevelTable
      .guardInsert(
        intKeyDB,
        AccessLevel.Read,
        1 as UserID,
        "comments",
        comment1,
        "postID",
        "commentID"
      )
      .execute();

    const comments2 = await intKeyDB
      .selectFrom("comments")
      .selectAll()
      .execute();
    expect(comments2).toHaveLength(0);
  });
});
