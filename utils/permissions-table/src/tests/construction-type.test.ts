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
        userTable: "users",
        userIDColumn: "id",
        // @ts-expect-error - invalid key data type
        userIDDataType: "string",
        resourceTable: "posts",
        resourceIDColumn: "postID",
        resourceIDDataType: "integer",
        resourceOwnerKeyColumn: "ownerID",
      });
      new PermissionsTable({
        ownerPermissions: AccessLevel.Write,
        userTable: "users",
        userIDColumn: "id",
        userIDDataType: "integer",
        resourceTable: "posts",
        resourceIDColumn: "postID",
        // @ts-expect-error - invalid key data type
        resourceIDDataType: "string",
        resourceOwnerKeyColumn: "ownerID",
      });
    });

    ignore(
      "constructor requires key types to be consistent with data types",
      () => {
        new PermissionsTable({
          ownerPermissions: AccessLevel.Write,
          userTable: "users",
          userIDColumn: "id",
          userIDDataType: "integer",
          resourceTable: "posts",
          resourceIDColumn: "postID",
          resourceIDDataType: "integer",
          resourceOwnerKeyColumn: "ownerID",
          // @ts-expect-error - user key not of correct type
          sampleUserID: "invalid",
        });
        new PermissionsTable({
          ownerPermissions: AccessLevel.Write,
          userTable: "users",
          userIDColumn: "id",
          userIDDataType: "text",
          resourceTable: "posts",
          resourceIDColumn: "postID",
          resourceIDDataType: "integer",
          resourceOwnerKeyColumn: "ownerID",
          // @ts-expect-error - user key not of correct type
          sampleUserID: 1 as UserID,
        });

        new PermissionsTable({
          userTable: "users",
          userIDColumn: "id",
          userIDDataType: "integer",
          resourceTable: "posts",
          resourceIDColumn: "postID",
          resourceIDDataType: "integer",
          resourceOwnerKeyColumn: "ownerID",
          // @ts-expect-error - resource key not of correct type
          sampleResourceID: "invalid",
        });
        new PermissionsTable({
          ownerPermissions: AccessLevel.Write,
          userTable: "users",
          userIDColumn: "id",
          userIDDataType: "integer",
          resourceTable: "posts",
          resourceIDColumn: "postID",
          resourceIDDataType: "text",
          resourceOwnerKeyColumn: "ownerID",
          // @ts-expect-error - resource key not of correct type
          sampleResourceID: 1 as PostID,
        });
      }
    );

    ignore("correctly defaults UserID and ResourceID types", () => {
      const db = null as unknown as Kysely<any>;
      const table1 = new PermissionsTable({
        ownerPermissions: AccessLevel.Write,
        userTable: "users",
        userIDColumn: "id",
        userIDDataType: "integer",
        resourceTable: "posts",
        resourceIDColumn: "postID",
        resourceIDDataType: "integer",
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
        userTable: "users",
        userIDColumn: "id",
        userIDDataType: "text",
        resourceTable: "posts",
        resourceIDColumn: "postID",
        resourceIDDataType: "uuid",
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
