import { Kysely } from "kysely";

import { AccessLevelTable } from "../lib/access-level-table";
import { AccessLevel, ignore } from "./lib/test-util";

type UserID = number & { readonly __brand: unique symbol };
type PostID = number & { readonly __brand: unique symbol };

// TODO: test update
// TODO: test delete
// TODO: test insert

// TODO: make sure guard funcs require query on resource as input (test);
//   consider revising how the guard functions work. Can the guard functions
//   create the initial queries?

describe("AccessLevelTable construction", () => {
  it("validates constructor arguments", () => {
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
});
