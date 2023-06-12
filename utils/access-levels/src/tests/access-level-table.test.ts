import { AccessLevelTable } from "../lib/access-level-table";
import { createDB, destroyDB, ignore } from "./test-util";
import { testGuardingSelect } from "./test-guarding-select";
import { Kysely } from "kysely";

type AccessLevel = number & { readonly __brand: unique symbol };
const AccessLevel = {
  None: 0 as AccessLevel,
  Read: 1 as AccessLevel,
  Write: 2 as AccessLevel,
} as const;

type UserID = number & { readonly __brand: unique symbol };
type PostID = number & { readonly __brand: unique symbol };

// TODO: make sure guard funcs require query on resource as input (test)

describe("AccessLevelTable", () => {
  describe("guardSelectingAccessLevel()", () => {
    testGuardingSelect<UserID, PostID>("guardSelectingAccessLevel", true);
  });

  describe("guardQuery()", () => {
    testGuardingSelect<UserID, PostID>("guardQuery", false);

    it("conveys access to a joined table", async () => {
      const db = await createDB();
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

      const comments = await accessLevelTable
        .guardQuery(
          db,
          AccessLevel.Read,
          1 as UserID,
          db
            .selectFrom("posts")
            .innerJoin("comments", (join) =>
              join.onRef("comments.postID", "=", "posts.postID")
            )
        )
        .select(["comments.commentID", "comments.comment"])
        .execute();
      comments.sort((a, b) => a.commentID - b.commentID);
      expect(comments).toEqual([
        { commentID: 1, comment: "Comment 1" },
        { commentID: 2, comment: "Comment 2" },
      ]);

      await accessLevelTable.drop(db);
      await destroyDB(db);
    });
  });

  ignore("invalid key data types", () => {
    new AccessLevelTable({
      ownerAccessLevel: AccessLevel.Write,
      userTableName: "users",
      userKeyColumn: "id",
      // @ts-expect-error - invalid key data type
      userKeyDataType: "string",
      resourceTableName: "posts",
      resourceKeyColumn: "postID",
      resourceKeyDataType: "integer",
      resourceOwnerKeyColumn: "ownerID",
    });
    new AccessLevelTable({
      ownerAccessLevel: AccessLevel.Write,
      userTableName: "users",
      userKeyColumn: "id",
      userKeyDataType: "integer",
      resourceTableName: "posts",
      resourceKeyColumn: "postID",
      // @ts-expect-error - invalid key data type
      resourceKeyDataType: "string",
      resourceOwnerKeyColumn: "ownerID",
    });
  });

  ignore(
    "constructor requires key types to be consistent with data types",
    () => {
      new AccessLevelTable({
        ownerAccessLevel: AccessLevel.Write,
        userTableName: "users",
        userKeyColumn: "id",
        userKeyDataType: "integer",
        resourceTableName: "posts",
        resourceKeyColumn: "postID",
        resourceKeyDataType: "integer",
        resourceOwnerKeyColumn: "ownerID",
        // @ts-expect-error - user key not of correct type
        sampleUserKey: "invalid",
      });
      new AccessLevelTable({
        ownerAccessLevel: AccessLevel.Write,
        userTableName: "users",
        userKeyColumn: "id",
        userKeyDataType: "text",
        resourceTableName: "posts",
        resourceKeyColumn: "postID",
        resourceKeyDataType: "integer",
        resourceOwnerKeyColumn: "ownerID",
        // @ts-expect-error - user key not of correct type
        sampleUserKey: 1 as UserID,
      });

      new AccessLevelTable({
        userTableName: "users",
        userKeyColumn: "id",
        userKeyDataType: "integer",
        resourceTableName: "posts",
        resourceKeyColumn: "postID",
        resourceKeyDataType: "integer",
        resourceOwnerKeyColumn: "ownerID",
        // @ts-expect-error - resource key not of correct type
        sampleResourceKey: "invalid",
      });
      new AccessLevelTable({
        ownerAccessLevel: AccessLevel.Write,
        userTableName: "users",
        userKeyColumn: "id",
        userKeyDataType: "integer",
        resourceTableName: "posts",
        resourceKeyColumn: "postID",
        resourceKeyDataType: "text",
        resourceOwnerKeyColumn: "ownerID",
        // @ts-expect-error - resource key not of correct type
        sampleResourceKey: 1 as PostID,
      });
    }
  );

  ignore("correctly defaults UserKey and ResourceKey types", () => {
    const db = null as unknown as Kysely<any>;
    const table1 = new AccessLevelTable({
      ownerAccessLevel: AccessLevel.Write,
      userTableName: "users",
      userKeyColumn: "id",
      userKeyDataType: "integer",
      resourceTableName: "posts",
      resourceKeyColumn: "postID",
      resourceKeyDataType: "integer",
      resourceOwnerKeyColumn: "ownerID",
    });
    table1.guardSelectingAccessLevel(
      db,
      AccessLevel.Read,
      // @ts-expect-error - user key not of correct type
      "invalid",
      db.selectFrom("posts")
    );
    // @ts-expect-error - user key not of correct type
    table1.setAccessLevel(db, "invalid", 1, AccessLevel.Read);
    // @ts-expect-error - resource key not of correct type
    table1.setAccessLevel(db, 1, "invalid", AccessLevel.Read);

    const table2 = new AccessLevelTable({
      ownerAccessLevel: AccessLevel.Write,
      userTableName: "users",
      userKeyColumn: "id",
      userKeyDataType: "text",
      resourceTableName: "posts",
      resourceKeyColumn: "postID",
      resourceKeyDataType: "uuid",
      resourceOwnerKeyColumn: "ownerID",
    });
    table2.guardSelectingAccessLevel(
      db,
      AccessLevel.Read,
      // @ts-expect-error - user key not of correct type
      1,
      db.selectFrom("posts")
    );
    // @ts-expect-error - user key not of correct type
    table2.setAccessLevel(db, 1, "valid", AccessLevel.Read);
    // @ts-expect-error - resource key not of correct type
    table2.setAccessLevel(db, "valid", 1, AccessLevel.Read);
  });
});
