import { Kysely } from "kysely";

import { PermissionsTable } from "../lib/permissions-table";
import {
  AccessLevel,
  createDatabase,
  destroyDB,
  ignore,
} from "./lib/test-util";
import {
  IntKeyDB,
  IntPostID,
  getIntKeyPermissionsTable,
  initIntKeyDB,
} from "./lib/intkey-tables";
import { StrKeyDB, getStrKeyPermissionsTable } from "./lib/strkey-tables";

let intKeyDB: Kysely<IntKeyDB>;
const intKeyTable = getIntKeyPermissionsTable();
let strKeyDB: Kysely<StrKeyDB>;
const strKeyTable = getStrKeyPermissionsTable();

beforeAll(async () => {
  await createDatabase();
});

afterEach(async () => {
  if (intKeyDB) {
    await destroyDB(intKeyDB, intKeyTable);
    intKeyDB = undefined as any;
  }
  if (strKeyDB) {
    await destroyDB(strKeyDB, strKeyTable);
    strKeyDB = undefined as any;
  }
});

describe("PermissionsTable construction", () => {
  it("validates constructor arguments", () => {
    ignore("invalid key data types", () => {
      new PermissionsTable({
        maxPublicPermissions: AccessLevel.Read,
        maxUserGrantedPermissions: AccessLevel.Write,
        userTable: "users",
        userIDColumn: "id",
        // @ts-expect-error - invalid key data type
        userIDDataType: "string",
        resourceTable: "posts",
        resourceIDColumn: "postID",
        resourceIDDataType: "integer",
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
      });
    });

    ignore(
      "constructor requires key types to be consistent with data types",
      () => {
        new PermissionsTable({
          maxPublicPermissions: AccessLevel.Read,
          maxUserGrantedPermissions: AccessLevel.Write,
          userTable: "users",
          userIDColumn: "id",
          userIDDataType: "integer",
          resourceTable: "posts",
          resourceIDColumn: "postID",
          resourceIDDataType: "integer",
          // @ts-expect-error - user key not of correct type
          sampleUserID: "invalid",
        });
        new PermissionsTable({
          maxPublicPermissions: AccessLevel.Read,
          maxUserGrantedPermissions: AccessLevel.Write,
          userTable: "users",
          userIDColumn: "id",
          userIDDataType: "text",
          resourceTable: "posts",
          resourceIDColumn: "postID",
          resourceIDDataType: "integer",
          // @ts-expect-error - user key not of correct type
          sampleUserID: 1 as UserID,
        });

        new PermissionsTable({
          maxPublicPermissions: AccessLevel.Read,
          maxUserGrantedPermissions: AccessLevel.Write,
          userTable: "users",
          userIDColumn: "id",
          userIDDataType: "integer",
          resourceTable: "posts",
          resourceIDColumn: "postID",
          resourceIDDataType: "integer",
          // @ts-expect-error - resource key not of correct type
          sampleResourceID: "invalid",
        });
        new PermissionsTable({
          maxPublicPermissions: AccessLevel.Read,
          maxUserGrantedPermissions: AccessLevel.Write,
          userTable: "users",
          userIDColumn: "id",
          userIDDataType: "integer",
          resourceTable: "posts",
          resourceIDColumn: "postID",
          resourceIDDataType: "text",
          // @ts-expect-error - resource key not of correct type
          sampleResourceID: 1 as PostID,
        });
      }
    );

    ignore("correctly defaults UserID and ResourceID types", () => {
      const db = null as unknown as Kysely<any>;
      const table1 = new PermissionsTable({
        maxPublicPermissions: AccessLevel.Read,
        maxUserGrantedPermissions: AccessLevel.Write,
        userTable: "users",
        userIDColumn: "id",
        userIDDataType: "integer",
        resourceTable: "posts",
        resourceIDColumn: "postID",
        resourceIDDataType: "integer",
      });
      table1.getPermissions(
        db,
        // @ts-expect-error - user key not of correct type
        "invalid",
        1 as IntPostID
      );
      // @ts-expect-error - user key not of correct type
      table1.setPermissions(db, "invalid", 1, AccessLevel.Read, null);
      // @ts-expect-error - resource key not of correct type
      table1.setPermissions(db, 1, "invalid", AccessLevel.Read, null);
      // @ts-expect-error - permissions not of correct type
      table1.setPermissions(db, 1, 1, 0, null);
      // @ts-expect-error - grantee not of correct type
      table1.setPermissions(db, 1, 1, AccessLevel.Read, "invalid");

      const table2 = new PermissionsTable({
        maxPublicPermissions: AccessLevel.Read,
        maxUserGrantedPermissions: AccessLevel.Write,
        userTable: "users",
        userIDColumn: "id",
        userIDDataType: "text",
        resourceTable: "posts",
        resourceIDColumn: "postID",
        resourceIDDataType: "uuid",
      });
      table2.getPermissions(
        db,
        // @ts-expect-error - user key not of correct type
        1,
        "valid"
      );
      // @ts-expect-error - user key not of correct type
      table2.setPermissions(db, 1, "valid", AccessLevel.Read, null);
      // @ts-expect-error - resource key not of correct type
      table2.setPermissions(db, "valid", 1, AccessLevel.Read, null);
      // @ts-expect-error - permissions not of correct type
      table2.setPermissions(db, "valid", "valid", 0, null);
      // @ts-expect-error - grantee not of correct type
      table2.setPermissions(db, "valid", "valid", AccessLevel.Read, 1);
    });
  });

  describe("cascade deletes permissions", () => {
    it("deletes permissions rows when user is deleted", async () => {
      intKeyDB = await initIntKeyDB(intKeyTable);
      const query = intKeyDB
        .selectFrom(intKeyTable.getTableName())
        .select("resourceID")
        .where("grantedTo", "=", 5);

      let rows = await query.execute();
      expect(rows).toHaveLength(2);

      await intKeyDB.deleteFrom("users").where("id", "=", 5).execute();

      rows = await query.execute();
      expect(rows).toHaveLength(0);
    });

    it("deletes permissions rows when resource is deleted", async () => {
      intKeyDB = await initIntKeyDB(intKeyTable);
      const query = intKeyDB
        .selectFrom(intKeyTable.getTableName())
        .select("grantedTo")
        .where("resourceID", "=", 3);

      let rows = await query.execute();
      expect(rows).toHaveLength(2);

      await intKeyDB.deleteFrom("posts").where("postID", "=", 3).execute();

      rows = await query.execute();
      expect(rows).toHaveLength(0);
    });
  });
});
