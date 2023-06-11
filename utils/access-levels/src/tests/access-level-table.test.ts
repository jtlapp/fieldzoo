import { AccessLevelTable } from "../lib/access-level-table";
import { ignore } from "./test-util";
import { testGuardOnSelect } from "./test-guard-on-select";

type AccessLevel = number & { readonly __brand: unique symbol };
const AccessLevel = {
  None: 0 as AccessLevel,
  Read: 1 as AccessLevel,
  Write: 2 as AccessLevel,
} as const;

type UserID = number & { readonly __brand: unique symbol };
type PostID = number & { readonly __brand: unique symbol };

describe("AccessLevelTable", () => {
  describe("guardRead()", () => {
    testGuardOnSelect<UserID, PostID>("guardRead");
  });

  describe("guardQuery()", () => {
    testGuardOnSelect<UserID, PostID>("guardQuery");
  });

  ignore("invalid key data types", () => {
    new AccessLevelTable({
      userTableName: "users",
      userKeyColumn: "id",
      // @ts-expect-error - invalid key data type
      userKeyDataType: "string",
      resourceTableName: "posts",
      resourceKeyColumn: "postID",
      resourceKeyDataType: "integer",
      ownerKeyColumn: "ownerID",
    });
    new AccessLevelTable({
      userTableName: "users",
      userKeyColumn: "id",
      userKeyDataType: "integer",
      resourceTableName: "posts",
      resourceKeyColumn: "postID",
      // @ts-expect-error - invalid key data type
      resourceKeyDataType: "string",
      ownerKeyColumn: "ownerID",
    });
  });

  ignore(
    "constructor requires key types to be consistent with data types",
    () => {
      new AccessLevelTable({
        userTableName: "users",
        userKeyColumn: "id",
        userKeyDataType: "integer",
        resourceTableName: "posts",
        resourceKeyColumn: "postID",
        resourceKeyDataType: "integer",
        ownerKeyColumn: "ownerID",
        // @ts-expect-error - user key not of correct type
        sampleUserKey: "invalid",
      });
      new AccessLevelTable({
        userTableName: "users",
        userKeyColumn: "id",
        userKeyDataType: "text",
        resourceTableName: "posts",
        resourceKeyColumn: "postID",
        resourceKeyDataType: "integer",
        ownerKeyColumn: "ownerID",
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
        ownerKeyColumn: "ownerID",
        // @ts-expect-error - resource key not of correct type
        sampleResourceKey: "invalid",
      });
      new AccessLevelTable({
        userTableName: "users",
        userKeyColumn: "id",
        userKeyDataType: "integer",
        resourceTableName: "posts",
        resourceKeyColumn: "postID",
        resourceKeyDataType: "text",
        ownerKeyColumn: "ownerID",
        // @ts-expect-error - resource key not of correct type
        sampleResourceKey: 1 as PostID,
      });
    }
  );

  ignore("correctly defaults UserKey and ResourceKey types", () => {
    const table1 = new AccessLevelTable({
      userTableName: "users",
      userKeyColumn: "id",
      userKeyDataType: "integer",
      resourceTableName: "posts",
      resourceKeyColumn: "postID",
      resourceKeyDataType: "integer",
      ownerKeyColumn: "ownerID",
      sampleAccessLevel: AccessLevel.None,
    });
    // @ts-expect-error - user key not of correct type
    table1.guardRead(db, AccessLevel.Read, "invalid", db.selectFrom("posts"));
    // @ts-expect-error - user key not of correct type
    table1.setAccessLevel(db, "invalid", 1, AccessLevel.Read);
    // @ts-expect-error - resource key not of correct type
    table1.setAccessLevel(db, 1, "invalid", AccessLevel.Read);

    const table2 = new AccessLevelTable({
      userTableName: "users",
      userKeyColumn: "id",
      userKeyDataType: "text",
      resourceTableName: "posts",
      resourceKeyColumn: "postID",
      resourceKeyDataType: "uuid",
      ownerKeyColumn: "ownerID",
      sampleAccessLevel: AccessLevel.None,
    });
    // @ts-expect-error - user key not of correct type
    table2.guardRead(db, AccessLevel.Read, 1, db.selectFrom("posts"));
    // @ts-expect-error - user key not of correct type
    table2.setAccessLevel(db, 1, "valid", AccessLevel.Read);
    // @ts-expect-error - resource key not of correct type
    table2.setAccessLevel(db, "valid", 1, AccessLevel.Read);
  });
});
