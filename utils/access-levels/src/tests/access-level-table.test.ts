import { Kysely } from "kysely";

import { AccessLevelTable } from "../lib/access-level-table";
import { Database, createDB, destroyDB } from "./test-util";

enum AccessLevel {
  None,
  Read,
  Write,
}

// TODO: test update
// TODO: test delete

describe("AccessLevelTable", () => {
  let db: Kysely<Database>;
  const accessLevelTable = new AccessLevelTable<
    AccessLevel,
    "integer",
    "integer"
  >({
    userTableName: "users",
    userKeyColumn: "id",
    userKeyDataType: "integer",
    resourceTableName: "posts",
    resourceKeyColumn: "postID",
    resourceKeyDataType: "integer",
    ownerKeyColumn: "ownerID",
  });

  beforeEach(async () => {
    db = await createDB();
    await accessLevelTable.create(db);

    // user1 has no access to any posts
    await db
      .insertInto("users")
      .values({ handle: "user1", name: "User 1" })
      .execute();
    // user1 owns post 1, but no assigned access levels
    await db
      .insertInto("users")
      .values({ handle: "user2", name: "User 2" })
      .execute();
    // user2 owns post 2 and post 3, but no assigned access levels
    await db
      .insertInto("users")
      .values({ handle: "user3", name: "User 3" })
      .execute();
    // user4 owns post 4 and has read access to post 1
    await db
      .insertInto("users")
      .values({ handle: "user4", name: "User 4" })
      .execute();
    // user5 owns no posts, has read access to post 2, write access to post 3
    await db
      .insertInto("users")
      .values({ handle: "user5", name: "User 5" })
      .execute();

    // posts
    await db
      .insertInto("posts")
      .values({ ownerID: 2, title: "Post 1" })
      .execute();
    await db
      .insertInto("posts")
      .values({ ownerID: 3, title: "Post 2" })
      .execute();
    await db
      .insertInto("posts")
      .values({ ownerID: 3, title: "Post 3" })
      .execute();
    await db
      .insertInto("posts")
      .values({ ownerID: 4, title: "Post 4" })
      .execute();

    // access level assignments
    await accessLevelTable.setAccessLevel(db, 4, 1, AccessLevel.Read);
    await accessLevelTable.setAccessLevel(db, 5, 2, AccessLevel.Read);
    await accessLevelTable.setAccessLevel(db, 5, 3, AccessLevel.Write);
  });
  afterEach(async () => {
    await accessLevelTable.drop(db);
    await destroyDB(db);
  });

  it("grants no access when no rights", async () => {
    const query = db.selectFrom("posts").select("title");
    const rows = await accessLevelTable
      .restrictQuery(db, AccessLevel.Write, 1, query)
      .execute();
    expect(rows).toHaveLength(0);
  });

  it("grants access to the resource owner", async () => {
    const query = db.selectFrom("posts").select("title");
    let rows = await accessLevelTable
      .restrictQuery(db, AccessLevel.Write, 2, query)
      .execute();
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("Post 1");

    rows = await accessLevelTable
      .restrictQuery(db, AccessLevel.Write, 3, query)
      .execute();
    expect(rows).toHaveLength(2);
    expect(rows[0].title).toBe("Post 2");
    expect(rows[1].title).toBe("Post 3");
  });

  it("grants access to users by access level, but no higher", async () => {
    const query = db.selectFrom("posts").select("title");

    // user sees posts to which it has sufficient access

    let rows = await accessLevelTable
      .restrictQuery(db, AccessLevel.Read, 4, query)
      .execute();
    expect(rows).toHaveLength(2);
    expect(rows[0].title).toBe("Post 4");
    expect(rows[1].title).toBe("Post 1");

    // user does not see posts to which it does not have sufficient access

    rows = await accessLevelTable
      .restrictQuery(db, AccessLevel.Write, 4, query)
      .execute();
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("Post 4");

    // setting access level to 0 removes access

    await accessLevelTable.setAccessLevel(db, 4, 1, AccessLevel.None);
    rows = await accessLevelTable
      .restrictQuery(db, AccessLevel.Read, 4, query)
      .execute();
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("Post 4");
  });

  it("grants access to assigned access level and lower", async () => {
    const query = db.selectFrom("posts").select("title");

    let rows = await accessLevelTable
      .restrictQuery(db, AccessLevel.Read, 5, query)
      .execute();
    expect(rows).toHaveLength(2);
    expect(rows[0].title).toBe("Post 2");
    expect(rows[1].title).toBe("Post 3");

    rows = await accessLevelTable
      .restrictQuery(db, AccessLevel.Write, 5, query)
      .execute();
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("Post 3");
  });

  it("returns a single row or none when query restricted to single row", async () => {
    const queryForPost = (postID: number) =>
      db.selectFrom("posts").select("title").where("postID", "=", postID);
    const queryForPost1 = queryForPost(1);
    const queryForPost2 = queryForPost(2);
    const queryForPost4 = queryForPost(4);

    // one post returned if user has sufficient access, returning array

    let rows = await accessLevelTable
      .restrictQuery(db, AccessLevel.Read, 4, queryForPost1)
      .execute();
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("Post 1");

    // no post returned if user does not have sufficient access, returning array

    rows = await accessLevelTable
      .restrictQuery(db, AccessLevel.Write, 4, queryForPost1)
      .execute();
    expect(rows).toHaveLength(0);

    // one post returned if user is owner, returning single row

    let row = await accessLevelTable
      .restrictQuery(db, AccessLevel.Write, 4, queryForPost4)
      .executeTakeFirst();
    expect(row?.title).toBe("Post 4");

    // no post returned if user has no access, returning single row

    row = await accessLevelTable
      .restrictQuery(db, AccessLevel.Write, 4, queryForPost2)
      .executeTakeFirst();
    expect(row).toBeUndefined();
  });

  it("deletes access level rows when user is deleted", async () => {
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
});
