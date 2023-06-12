import { Kysely, SelectQueryBuilder, Selectable } from "kysely";

import { AccessLevelTable } from "../lib/access-level-table";
import {
  AccessLevel,
  Database,
  createDB,
  destroyDB,
  ignore,
} from "./test-util";

export function testGuardingSelect<
  UserID extends number,
  PostID extends number
>(
  guardFuncName: "guardSelectingAccessLevel" | "guardQuery",
  checkAccessLevel: boolean
) {
  let db: Kysely<Database>;
  const accessLevelTable = new AccessLevelTable({
    ownerAccessLevel: AccessLevel.Write,
    userTableName: "users",
    userKeyColumn: "id",
    userKeyDataType: "integer",
    resourceTableName: "posts",
    resourceKeyColumn: "postID",
    resourceKeyDataType: "integer",
    resourceOwnerKeyColumn: "ownerID",
    sampleUserKey: 1 as UserID,
    sampleResourceKey: 1 as PostID,
  });
  const guard = accessLevelTable[guardFuncName].bind(accessLevelTable) as (
    db: Kysely<Database>,
    accessLevel: AccessLevel,
    userKey: UserID,
    query: SelectQueryBuilder<Database, "posts", Selectable<Database["posts"]>>
  ) => SelectQueryBuilder<
    Database,
    "posts",
    Selectable<Database["posts"] & { accessLevel?: number }>
  >;

  async function createDirectAccessTestDB() {
    db = await createDB();
    await accessLevelTable.create(db);

    await db
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
    await db
      .insertInto("posts")
      .values([
        { ownerID: 2, title: "Post 1" },
        { ownerID: 3, title: "Post 2" },
        { ownerID: 3, title: "Post 3" },
        { ownerID: 4, title: "Post 4" },
      ])
      .execute();

    // access level assignments
    await accessLevelTable.setAccessLevel(
      db,
      4 as UserID,
      1 as PostID,
      AccessLevel.Read
    );
    await accessLevelTable.setAccessLevel(
      db,
      5 as UserID,
      2 as PostID,
      AccessLevel.Read
    );
    await accessLevelTable.setAccessLevel(
      db,
      5 as UserID,
      3 as PostID,
      AccessLevel.Write
    );
  }

  async function createIndirectAccessTestDB() {
    db = await createDB();
    const accessLevelTable = new AccessLevelTable({
      ownerAccessLevel: AccessLevel.Write,
      userTableName: "users",
      userKeyColumn: "id",
      userKeyDataType: "integer",
      resourceTableName: "posts",
      resourceKeyColumn: "postID",
      resourceKeyDataType: "integer",
      resourceOwnerKeyColumn: "ownerID",
      sampleUserKey: 1 as UserID,
      sampleResourceKey: 1 as PostID,
    });
    await accessLevelTable.create(db);

    // user1 owns post 1, has read access to post 2, and no access to post 3
    await db
      .insertInto("users")
      .values([
        { handle: "user1", name: "User 1" },
        { handle: "user2", name: "User 2" },
      ])
      .execute();
    await db
      .insertInto("posts")
      .values([
        { ownerID: 1, title: "Post 1" },
        { ownerID: 2, title: "Post 2" },
        { ownerID: 2, title: "Post 3" },
      ])
      .execute();
    await db
      .insertInto("comments")
      .values([
        { postID: 1, comment: "Comment 1" },
        { postID: 2, comment: "Comment 2" },
        { postID: 3, comment: "Comment 3" },
      ])
      .execute();
    await accessLevelTable.setAccessLevel(
      db,
      1 as UserID,
      2 as PostID,
      AccessLevel.Read
    );
  }

  afterEach(async () => {
    if (db) {
      await accessLevelTable.drop(db);
      await destroyDB(db);
      db = undefined as any;
    }
  });

  it("grants no access when no rights", async () => {
    await createDirectAccessTestDB();
    const query = db.selectFrom("posts").selectAll("posts");
    const rows = await guard(
      db,
      AccessLevel.Write,
      1 as UserID,
      query
    ).execute();
    expect(rows).toHaveLength(0);
  });

  it("grants access to the resource owner", async () => {
    await createDirectAccessTestDB();
    const query = db.selectFrom("posts").selectAll("posts");
    let rows = await guard(db, AccessLevel.Write, 2 as UserID, query).execute();
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("Post 1");
    if (checkAccessLevel) {
      expect(rows[0].accessLevel).toBe(AccessLevel.Write);
    }

    rows = await guard(db, AccessLevel.Write, 3 as UserID, query).execute();
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
    const query = db.selectFrom("posts").selectAll("posts");

    // user sees posts to which it has sufficient access

    let rows = await guard(db, AccessLevel.Read, 4 as UserID, query).execute();
    expect(rows).toHaveLength(2);
    rows.sort((a, b) => a.postID - b.postID);
    expect(rows[0].title).toBe("Post 1");
    expect(rows[1].title).toBe("Post 4");
    if (checkAccessLevel) {
      expect(rows[0].accessLevel).toBe(AccessLevel.Read);
      expect(rows[1].accessLevel).toBe(AccessLevel.Write);
    }

    // user does not see posts to which it does not have sufficient access

    rows = await guard(db, AccessLevel.Write, 4 as UserID, query).execute();
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("Post 4");
    if (checkAccessLevel) {
      expect(rows[0].accessLevel).toBe(AccessLevel.Write);
    }

    // setting access level to 0 removes access

    await accessLevelTable.setAccessLevel(
      db,
      4 as UserID,
      1 as PostID,
      AccessLevel.None
    );
    rows = await guard(db, AccessLevel.Read, 4 as UserID, query).execute();
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("Post 4");
    if (checkAccessLevel) {
      expect(rows[0].accessLevel).toBe(AccessLevel.Write);
    }
  });

  it("grants access to assigned access level and lower", async () => {
    await createDirectAccessTestDB();
    const query = db.selectFrom("posts").selectAll("posts");

    let rows = await guard(db, AccessLevel.Read, 5 as UserID, query).execute();
    expect(rows).toHaveLength(2);
    rows.sort((a, b) => a.postID - b.postID);
    expect(rows[0].title).toBe("Post 2");
    expect(rows[1].title).toBe("Post 3");
    if (checkAccessLevel) {
      expect(rows[0].accessLevel).toBe(AccessLevel.Read);
      expect(rows[1].accessLevel).toBe(AccessLevel.Write);
    }

    rows = await guard(db, AccessLevel.Write, 5 as UserID, query).execute();
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("Post 3");
    if (checkAccessLevel) {
      expect(rows[0].accessLevel).toBe(AccessLevel.Write);
    }
  });

  it("returns a single row or none when query restricted to single row", async () => {
    await createDirectAccessTestDB();
    const queryForPost = (postID: number) =>
      db.selectFrom("posts").selectAll("posts").where("postID", "=", postID);
    const queryForPost1 = queryForPost(1);
    const queryForPost2 = queryForPost(2);
    const queryForPost4 = queryForPost(4);

    // one post returned if user has sufficient access, returning array

    let rows = await guard(
      db,
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

    rows = await guard(
      db,
      AccessLevel.Write,
      4 as UserID,
      queryForPost1
    ).execute();
    expect(rows).toHaveLength(0);

    // one post returned if user is owner, returning single row

    let row = await guard(
      db,
      AccessLevel.Write,
      4 as UserID,
      queryForPost4
    ).executeTakeFirst();
    expect(row?.title).toBe("Post 4");
    if (checkAccessLevel) {
      expect(row?.accessLevel).toBe(AccessLevel.Write);
    }

    // no post returned if user has no access, returning single row

    row = await guard(
      db,
      AccessLevel.Write,
      4 as UserID,
      queryForPost2
    ).executeTakeFirst();
    expect(row).toBeUndefined();
  });

  it("deletes access level rows when user is deleted", async () => {
    await createDirectAccessTestDB();
    const query = db
      .selectFrom(accessLevelTable.getTableName())
      .select("resourceKey")
      .where("userKey", "=", 5);

    let rows = await query.execute();
    expect(rows).toHaveLength(2);

    await db.deleteFrom("users").where("id", "=", 5).execute();

    rows = await query.execute();
    expect(rows).toHaveLength(0);
  });

  it("deletes access level rows when resource is deleted", async () => {
    await createDirectAccessTestDB();
    const query = db
      .selectFrom(accessLevelTable.getTableName())
      .select("userKey")
      .where("resourceKey", "=", 3);

    let rows = await query.execute();
    expect(rows).toHaveLength(1);

    await db.deleteFrom("posts").where("postID", "=", 3).execute();

    rows = await query.execute();
    expect(rows).toHaveLength(0);
  });

  it("conveys access to a joined table, returning no resource columns", async () => {
    await createIndirectAccessTestDB();
    const results = await (
      accessLevelTable[guardFuncName].bind(accessLevelTable) as any
    )(
      db,
      AccessLevel.Read,
      1 as UserID,
      db
        .selectFrom("posts")
        .innerJoin("comments", (join) =>
          join.onRef("comments.postID", "=", "posts.postID")
        )
        .select(["comments.commentID", "comments.comment"])
    ).execute();
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
  });

  it("conveys access to a joined table, returning some resource columns", async () => {
    await createIndirectAccessTestDB();
    const results = await (
      accessLevelTable[guardFuncName].bind(accessLevelTable) as any
    )(
      db,
      AccessLevel.Read,
      1 as UserID,
      db
        .selectFrom("posts")
        .innerJoin("comments", (join) =>
          join.onRef("comments.postID", "=", "posts.postID")
        )
        .select(["comments.commentID", "comments.comment", "posts.title"])
    ).execute();
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
  });

  ignore(
    "guardSelectingAccessLevel() must use the correct resource table",
    () => {
      guard(
        db,
        AccessLevel.Read,
        1 as UserID,
        // @ts-expect-error - incorrect resource table
        db.selectFrom("users")
      );
    }
  );

  ignore("guardSelectingAccessLevel() requires provided key types", () => {
    guard(
      db,
      AccessLevel.Read,
      // @ts-expect-error - user key not of correct type
      1,
      db.selectFrom("posts")
    );
  });

  ignore("setAccessLevel() requires provided key types", () => {
    // @ts-expect-error - user key not of correct type
    accessLevelTable.setAccessLevel(db, 1, 1 as PostID, AccessLevel.Read);
    // @ts-expect-error - resource key not of correct type
    accessLevelTable.setAccessLevel(db, 1 as UserID, 1, AccessLevel.Read);
    // @ts-expect-error - access level not of correct type
    accessLevelTable.setAccessLevel(db, 1 as UserID, 1 as PostID, 0);
  });
}
