import { Kysely, SelectQueryBuilder, Selectable } from "kysely";

import {
  IntKeyDB,
  createIntKeyDB,
  getIntKeyAccessLevelTable,
} from "./intkey-tables";
import { AccessLevel, destroyDB, ignore } from "./test-util";

export function testGuardingIntKeySelect<
  UserID extends number,
  PostID extends number
>(guardFuncName: "guardQuery" | "guardSelectingAccessLevel") {
  const checkAccessLevel = guardFuncName == "guardSelectingAccessLevel";

  let intKeyDB: Kysely<IntKeyDB>;
  const intKeyAccessLevelTable = getIntKeyAccessLevelTable<UserID, PostID>();
  const intKeyGuard = intKeyAccessLevelTable[guardFuncName].bind(
    intKeyAccessLevelTable
  ) as (
    db: Kysely<IntKeyDB>,
    accessLevel: AccessLevel,
    userKey: UserID,
    query: SelectQueryBuilder<IntKeyDB, "posts", Selectable<IntKeyDB["posts"]>>
  ) => SelectQueryBuilder<
    IntKeyDB,
    "posts",
    Selectable<IntKeyDB["posts"] & { accessLevel?: number }>
  >;

  async function createDirectAccessTestDB() {
    intKeyDB = await createIntKeyDB();
    await intKeyAccessLevelTable.create(intKeyDB);

    await intKeyDB
      .insertInto("users")
      .values([
        // user1 has no access to any posts
        { handle: "user1", name: "User 1" },
        // user2 owns post 1, but no assigned access levels
        { handle: "user2", name: "User 2" },
        // user3 owns post 2 and post 3, but no assigned access levels
        { handle: "user3", name: "User 3" },
        // user4 owns post 4 and has read access to post 1
        { handle: "user4", name: "User 4" },
        // user5 owns no posts, has read access to post 2, write access to post 3
        { handle: "user5", name: "User 5" },
      ])
      .execute();

    // posts
    await intKeyDB
      .insertInto("posts")
      .values([
        { ownerID: 2, title: "Post 1" },
        { ownerID: 3, title: "Post 2" },
        { ownerID: 3, title: "Post 3" },
        { ownerID: 4, title: "Post 4" },
      ])
      .execute();

    // access level assignments
    await intKeyAccessLevelTable.setAccessLevel(
      intKeyDB,
      4 as UserID,
      1 as PostID,
      AccessLevel.Read
    );
    await intKeyAccessLevelTable.setAccessLevel(
      intKeyDB,
      5 as UserID,
      2 as PostID,
      AccessLevel.Read
    );
    await intKeyAccessLevelTable.setAccessLevel(
      intKeyDB,
      5 as UserID,
      3 as PostID,
      AccessLevel.Write
    );
  }

  async function createIndirectAccessTestDB() {
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
  }

  afterEach(async () => {
    if (intKeyDB) {
      await intKeyAccessLevelTable.drop(intKeyDB);
      await destroyDB(intKeyDB);
      intKeyDB = undefined as any;
    }
  });

  it("grants no access when no rights", async () => {
    await createDirectAccessTestDB();
    const query = intKeyDB.selectFrom("posts").selectAll("posts");
    const rows = await intKeyGuard(
      intKeyDB,
      AccessLevel.Write,
      1 as UserID,
      query
    ).execute();
    expect(rows).toHaveLength(0);
  });

  it("grants access to the resource owner", async () => {
    await createDirectAccessTestDB();
    const query = intKeyDB.selectFrom("posts").selectAll("posts");
    let rows = await intKeyGuard(
      intKeyDB,
      AccessLevel.Write,
      2 as UserID,
      query
    ).execute();
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("Post 1");
    if (checkAccessLevel) {
      expect(rows[0].accessLevel).toBe(AccessLevel.Write);
    }

    rows = await intKeyGuard(
      intKeyDB,
      AccessLevel.Write,
      3 as UserID,
      query
    ).execute();
    expect(rows).toHaveLength(2);
    rows.sort((a, b) => a.postID - b.postID);
    expect(rows[0].title).toBe("Post 2");
    expect(rows[1].title).toBe("Post 3");
    if (checkAccessLevel) {
      expect(rows[0].accessLevel).toBe(AccessLevel.Write);
      expect(rows[1].accessLevel).toBe(AccessLevel.Write);
    }
  });

  it("grants access to users by access level, but no higher", async () => {
    await createDirectAccessTestDB();
    const query = intKeyDB.selectFrom("posts").selectAll("posts");

    // user sees posts to which it has sufficient access

    let rows = await intKeyGuard(
      intKeyDB,
      AccessLevel.Read,
      4 as UserID,
      query
    ).execute();
    expect(rows).toHaveLength(2);
    rows.sort((a, b) => a.postID - b.postID);
    expect(rows[0].title).toBe("Post 1");
    expect(rows[1].title).toBe("Post 4");
    if (checkAccessLevel) {
      expect(rows[0].accessLevel).toBe(AccessLevel.Read);
      expect(rows[1].accessLevel).toBe(AccessLevel.Write);
    }

    // user does not see posts to which it does not have sufficient access

    rows = await intKeyGuard(
      intKeyDB,
      AccessLevel.Write,
      4 as UserID,
      query
    ).execute();
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("Post 4");
    if (checkAccessLevel) {
      expect(rows[0].accessLevel).toBe(AccessLevel.Write);
    }

    // setting access level to 0 removes access

    await intKeyAccessLevelTable.setAccessLevel(
      intKeyDB,
      4 as UserID,
      1 as PostID,
      AccessLevel.None
    );
    rows = await intKeyGuard(
      intKeyDB,
      AccessLevel.Read,
      4 as UserID,
      query
    ).execute();
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("Post 4");
    if (checkAccessLevel) {
      expect(rows[0].accessLevel).toBe(AccessLevel.Write);
    }
  });

  it("grants access to assigned access level and lower", async () => {
    await createDirectAccessTestDB();
    const query = intKeyDB.selectFrom("posts").selectAll("posts");

    let rows = await intKeyGuard(
      intKeyDB,
      AccessLevel.Read,
      5 as UserID,
      query
    ).execute();
    expect(rows).toHaveLength(2);
    rows.sort((a, b) => a.postID - b.postID);
    expect(rows[0].title).toBe("Post 2");
    expect(rows[1].title).toBe("Post 3");
    if (checkAccessLevel) {
      expect(rows[0].accessLevel).toBe(AccessLevel.Read);
      expect(rows[1].accessLevel).toBe(AccessLevel.Write);
    }

    rows = await intKeyGuard(
      intKeyDB,
      AccessLevel.Write,
      5 as UserID,
      query
    ).execute();
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("Post 3");
    if (checkAccessLevel) {
      expect(rows[0].accessLevel).toBe(AccessLevel.Write);
    }
  });

  it("returns a single row or none when query restricted to single row", async () => {
    await createDirectAccessTestDB();
    const queryForPost = (postID: number) =>
      intKeyDB
        .selectFrom("posts")
        .selectAll("posts")
        .where("postID", "=", postID);
    const queryForPost1 = queryForPost(1);
    const queryForPost2 = queryForPost(2);
    const queryForPost4 = queryForPost(4);

    // one post returned if user has sufficient access, returning array

    let rows = await intKeyGuard(
      intKeyDB,
      AccessLevel.Read,
      4 as UserID,
      queryForPost1
    ).execute();
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("Post 1");
    if (checkAccessLevel) {
      expect(rows[0].accessLevel).toBe(AccessLevel.Read);
    }

    // no post returned if user does not have sufficient access, returning array

    rows = await intKeyGuard(
      intKeyDB,
      AccessLevel.Write,
      4 as UserID,
      queryForPost1
    ).execute();
    expect(rows).toHaveLength(0);

    // one post returned if user is owner, returning single row

    let row = await intKeyGuard(
      intKeyDB,
      AccessLevel.Write,
      4 as UserID,
      queryForPost4
    ).executeTakeFirst();
    expect(row?.title).toBe("Post 4");
    if (checkAccessLevel) {
      expect(row?.accessLevel).toBe(AccessLevel.Write);
    }

    // no post returned if user has no access, returning single row

    row = await intKeyGuard(
      intKeyDB,
      AccessLevel.Write,
      4 as UserID,
      queryForPost2
    ).executeTakeFirst();
    expect(row).toBeUndefined();
  });

  it("deletes access level rows when user is deleted", async () => {
    await createDirectAccessTestDB();
    const query = intKeyDB
      .selectFrom(intKeyAccessLevelTable.getTableName())
      .select("resourceKey")
      .where("userKey", "=", 5);

    let rows = await query.execute();
    expect(rows).toHaveLength(2);

    await intKeyDB.deleteFrom("users").where("id", "=", 5).execute();

    rows = await query.execute();
    expect(rows).toHaveLength(0);
  });

  it("deletes access level rows when resource is deleted", async () => {
    await createDirectAccessTestDB();
    const query = intKeyDB
      .selectFrom(intKeyAccessLevelTable.getTableName())
      .select("userKey")
      .where("resourceKey", "=", 3);

    let rows = await query.execute();
    expect(rows).toHaveLength(1);

    await intKeyDB.deleteFrom("posts").where("postID", "=", 3).execute();

    rows = await query.execute();
    expect(rows).toHaveLength(0);
  });

  it("conveys access to a joined table, returning no resource columns", async () => {
    await createIndirectAccessTestDB();
    const query = intKeyDB
      .selectFrom("posts")
      .innerJoin("comments", (join) =>
        join.onRef("comments.postID", "=", "posts.postID")
      )
      .select(["comments.commentID", "comments.comment"]);

    // requiring read access

    let results = await (
      intKeyAccessLevelTable[guardFuncName].bind(intKeyAccessLevelTable) as any
    )(intKeyDB, AccessLevel.Read, 1 as UserID, query).execute();
    results.sort((a: any, b: any) => a.commentID - b.commentID);

    if (checkAccessLevel) {
      expect(results).toEqual([
        { commentID: 1, comment: "Comment 1", accessLevel: AccessLevel.Write },
        { commentID: 2, comment: "Comment 2", accessLevel: AccessLevel.Read },
      ]);
    } else {
      expect(results).toEqual([
        { commentID: 1, comment: "Comment 1" },
        { commentID: 2, comment: "Comment 2" },
      ]);
    }

    // requiring write access

    results = await (
      intKeyAccessLevelTable[guardFuncName].bind(intKeyAccessLevelTable) as any
    )(intKeyDB, AccessLevel.Write, 1 as UserID, query).execute();
    results.sort((a: any, b: any) => a.commentID - b.commentID);

    if (checkAccessLevel) {
      expect(results).toEqual([
        { commentID: 1, comment: "Comment 1", accessLevel: AccessLevel.Write },
      ]);
    } else {
      expect(results).toEqual([{ commentID: 1, comment: "Comment 1" }]);
    }
  });

  it("conveys access to a joined table, returning some resource columns", async () => {
    await createIndirectAccessTestDB();
    const query = intKeyDB
      .selectFrom("posts")
      .innerJoin("comments", (join) =>
        join.onRef("comments.postID", "=", "posts.postID")
      )
      .select(["comments.commentID", "comments.comment", "posts.title"]);

    // requiring read access

    let results = await (
      intKeyAccessLevelTable[guardFuncName].bind(intKeyAccessLevelTable) as any
    )(intKeyDB, AccessLevel.Read, 1 as UserID, query).execute();
    results.sort((a: any, b: any) => a.commentID - b.commentID);

    if (checkAccessLevel) {
      expect(results).toEqual([
        {
          commentID: 1,
          comment: "Comment 1",
          title: "Post 1",
          accessLevel: AccessLevel.Write,
        },
        {
          commentID: 2,
          comment: "Comment 2",
          title: "Post 2",
          accessLevel: AccessLevel.Read,
        },
      ]);
    } else {
      expect(results).toEqual([
        { commentID: 1, comment: "Comment 1", title: "Post 1" },
        { commentID: 2, comment: "Comment 2", title: "Post 2" },
      ]);
    }

    // requiring write access

    results = await (
      intKeyAccessLevelTable[guardFuncName].bind(intKeyAccessLevelTable) as any
    )(intKeyDB, AccessLevel.Write, 1 as UserID, query).execute();

    if (checkAccessLevel) {
      expect(results).toEqual([
        {
          commentID: 1,
          comment: "Comment 1",
          title: "Post 1",
          accessLevel: AccessLevel.Write,
        },
      ]);
    } else {
      expect(results).toEqual([
        { commentID: 1, comment: "Comment 1", title: "Post 1" },
      ]);
    }
  });

  ignore(
    "guardSelectingAccessLevel() must use the correct resource table",
    () => {
      intKeyGuard(
        intKeyDB,
        AccessLevel.Read,
        1 as UserID,
        // @ts-expect-error - incorrect resource table
        intKeyDB.selectFrom("users")
      );
    }
  );

  ignore("guardSelectingAccessLevel() requires provided key types", () => {
    intKeyGuard(
      intKeyDB,
      AccessLevel.Read,
      // @ts-expect-error - user key not of correct type
      1,
      intKeyDB.selectFrom("posts")
    );

    intKeyGuard(
      intKeyDB,
      AccessLevel.Read,
      // @ts-expect-error - user key not of correct type
      "u1",
      intKeyDB.selectFrom("posts")
    );
  });

  ignore("setAccessLevel() requires provided key types", () => {
    intKeyAccessLevelTable.setAccessLevel(
      intKeyDB,
      // @ts-expect-error - user key not of correct type
      1,
      1 as PostID,
      AccessLevel.Read
    );
    intKeyAccessLevelTable.setAccessLevel(
      intKeyDB,
      // @ts-expect-error - user key not of correct type
      "u1",
      1 as PostID,
      AccessLevel.Read
    );

    intKeyAccessLevelTable.setAccessLevel(
      intKeyDB,
      1 as UserID,
      // @ts-expect-error - resource key not of correct type
      1,
      AccessLevel.Read
    );
    intKeyAccessLevelTable.setAccessLevel(
      intKeyDB,
      1 as UserID,
      // @ts-expect-error - resource key not of correct type
      "p1",
      AccessLevel.Read
    );

    intKeyAccessLevelTable.setAccessLevel(
      intKeyDB,
      1 as UserID,
      1 as PostID,
      // @ts-expect-error - access level not of correct type
      0
    );
  });
}
