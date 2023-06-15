import { Kysely, SelectQueryBuilder, Selectable } from "kysely";

import {
  StrKeyDB,
  createStrKeyDB,
  getStrKeyPermissionsTable,
} from "./strkey-tables";
import { AccessLevel, destroyDB, ignore } from "./test-util";

// The library is elsewhere thoroughly tested for usage with integer keys,
// so here we only sample test to ensure that keys can be strings too.

export function testGuardingStrKeySelect<
  UserID extends string,
  PostID extends string
>(guardFuncName: "guardQuery" | "guardSelectingAccessLevel") {
  const checkAccessLevel = guardFuncName == "guardSelectingAccessLevel";

  let strKeyDB: Kysely<StrKeyDB>;
  const strKeyPermissionsTable = getStrKeyPermissionsTable<UserID, PostID>();
  const strKeyGuard = strKeyPermissionsTable[guardFuncName].bind(
    strKeyPermissionsTable
  ) as (
    db: Kysely<StrKeyDB>,
    permissions: AccessLevel,
    userID: UserID,
    query: SelectQueryBuilder<StrKeyDB, "posts", Selectable<StrKeyDB["posts"]>>
  ) => SelectQueryBuilder<
    StrKeyDB,
    "posts",
    Selectable<StrKeyDB["posts"] & { permissions?: number }>
  >;

  async function createAccessTestDB() {
    strKeyDB = await createStrKeyDB();
    await strKeyPermissionsTable.create(strKeyDB);

    // user1 owns post 1, has read access to post 2, and no access to post 3
    await strKeyDB
      .insertInto("users")
      .values([
        { id: "u1", handle: "user1", name: "User 1" },
        { id: "u2", handle: "user2", name: "User 2" },
      ])
      .execute();
    await strKeyDB
      .insertInto("posts")
      .values([
        { postID: "p1", ownerID: "u1", title: "Post 1" },
        { postID: "p2", ownerID: "u2", title: "Post 2" },
        { postID: "p3", ownerID: "u2", title: "Post 3" },
      ])
      .execute();
    await strKeyPermissionsTable.setPermissions(
      strKeyDB,
      "u1" as UserID,
      "p2" as PostID,
      AccessLevel.Read
    );
  }

  afterEach(async () => {
    if (strKeyDB) {
      await strKeyPermissionsTable.drop(strKeyDB);
      await destroyDB(strKeyDB);
      strKeyDB = undefined as any;
    }
  });

  it("grants access by resource owner and permissions", async () => {
    await createAccessTestDB();
    const query = strKeyDB.selectFrom("posts").selectAll("posts");

    // requiring read access

    let rows = await strKeyGuard(
      strKeyDB,
      AccessLevel.Read,
      "u1" as UserID,
      query
    ).execute();

    expect(rows).toHaveLength(2);
    rows.sort((a, b) => a.postID.localeCompare(b.postID));
    expect(rows[0].title).toBe("Post 1");
    expect(rows[1].title).toBe("Post 2");
    if (checkAccessLevel) {
      expect(rows[0].permissions).toBe(AccessLevel.Write);
      expect(rows[1].permissions).toBe(AccessLevel.Read);
    }

    // requiring write access

    rows = await strKeyGuard(
      strKeyDB,
      AccessLevel.Write,
      "u1" as UserID,
      query
    ).execute();

    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("Post 1");
    if (checkAccessLevel) {
      expect(rows[0].permissions).toBe(AccessLevel.Write);
    }
  });

  ignore("guardSelectingAccessLevel() requires provided key types", () => {
    strKeyGuard(
      strKeyDB,
      AccessLevel.Read,
      // @ts-expect-error - user key not of correct type
      1,
      strKeyDB.selectFrom("posts")
    );

    strKeyGuard(
      strKeyDB,
      AccessLevel.Read,
      // @ts-expect-error - user key not of correct type
      "u1",
      strKeyDB.selectFrom("posts")
    );
  });

  ignore("setPermissions() requires provided key types", () => {
    strKeyPermissionsTable.setPermissions(
      strKeyDB,
      // @ts-expect-error - user key not of correct type
      1,
      "p1" as PostID,
      AccessLevel.Read
    );
    strKeyPermissionsTable.setPermissions(
      strKeyDB,
      // @ts-expect-error - user key not of correct type
      "u1",
      "p1" as PostID,
      AccessLevel.Read
    );

    strKeyPermissionsTable.setPermissions(
      strKeyDB,
      "u1" as UserID,
      // @ts-expect-error - resource key not of correct type
      1,
      AccessLevel.Read
    );
    strKeyPermissionsTable.setPermissions(
      strKeyDB,
      "u1" as UserID,
      // @ts-expect-error - resource key not of correct type
      "p1",
      AccessLevel.Read
    );

    strKeyPermissionsTable.setPermissions(
      strKeyDB,
      "u1" as UserID,
      "p1" as PostID,
      // @ts-expect-error - permissions not of correct type
      0
    );
  });
}
