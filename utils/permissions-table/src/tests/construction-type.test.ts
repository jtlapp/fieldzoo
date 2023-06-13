import { Kysely } from "kysely";

import { PermissionsTable } from "../lib/permissions-table";
import { AccessLevel, ignore } from "./lib/test-util";

type UserID = number & { readonly __brand: unique symbol };
type PostID = number & { readonly __brand: unique symbol };

describe("PermissionsTable construction", () => {
  it("validates constructor arguments", () => {
    ignore("invalid key data types", () => {
      new PermissionsTable({
        ownerPermissions: AccessLevel.Write,
        userTableName: "users",
        userKeyColumn: "id",
        // @ts-expect-error - invalid key data type
        userKeyDataType: "string",
        resourceTableName: "posts",
        resourceKeyColumn: "postID",
        resourceKeyDataType: "integer",
        resourceOwnerKeyColumn: "ownerID",
      });
      new PermissionsTable({
        ownerPermissions: AccessLevel.Write,
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
        new PermissionsTable({
          ownerPermissions: AccessLevel.Write,
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
        new PermissionsTable({
          ownerPermissions: AccessLevel.Write,
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

        new PermissionsTable({
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
        new PermissionsTable({
          ownerPermissions: AccessLevel.Write,
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
      const table1 = new PermissionsTable({
        ownerPermissions: AccessLevel.Write,
        userTableName: "users",
        userKeyColumn: "id",
        userKeyDataType: "integer",
        resourceTableName: "posts",
        resourceKeyColumn: "postID",
        resourceKeyDataType: "integer",
        resourceOwnerKeyColumn: "ownerID",
      });
      table1.getPermissions(
        db,
        // @ts-expect-error - user key not of correct type
        "invalid",
        1 as PostID
      );
      table1.getMultiplePermissions(
        db,
        // @ts-expect-error - user key not of correct type
        "invalid",
        [1 as PostID]
      );
      // @ts-expect-error - user key not of correct type
      table1.setPermissions(db, "invalid", 1, AccessLevel.Read);
      // @ts-expect-error - resource key not of correct type
      table1.setPermissions(db, 1, "invalid", AccessLevel.Read);

      const table2 = new PermissionsTable({
        ownerPermissions: AccessLevel.Write,
        userTableName: "users",
        userKeyColumn: "id",
        userKeyDataType: "text",
        resourceTableName: "posts",
        resourceKeyColumn: "postID",
        resourceKeyDataType: "uuid",
        resourceOwnerKeyColumn: "ownerID",
      });
      table2.getPermissions(
        db,
        // @ts-expect-error - user key not of correct type
        1,
        "valid"
      );
      table2.getMultiplePermissions(
        db,
        // @ts-expect-error - user key not of correct type
        1,
        ["valid"]
      );
      // @ts-expect-error - user key not of correct type
      table2.setPermissions(db, 1, "valid", AccessLevel.Read);
      // @ts-expect-error - resource key not of correct type
      table2.setPermissions(db, "valid", 1, AccessLevel.Read);
    });
  });
});
