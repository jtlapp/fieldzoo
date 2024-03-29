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
  it("provides the default name for the permissions table", () => {
    expect(intKeyTable.tableName).toBe("test_posts_permissions");
  });

  it("creates permissions table with a custom name, with drop", async () => {
    const table = new PermissionsTable({
      ...getIntKeyPermissionsTable(),
      maxPublicPermissions: AccessLevel.Read,
      maxUserGrantedPermissions: AccessLevel.Write,
      tableName: "custom_permissions_table",
    });

    expect(table.tableName).toBe("custom_permissions_table");

    const db = await initIntKeyDB(table);
    intKeyDB = db; // for cleanup

    const query = db
      .selectFrom("custom_permissions_table" as keyof IntKeyDB)
      .select(["grantedTo", "resourceID", "permissions"]);
    try {
      const results = await query.execute();
      expect(results.length).toBeGreaterThan(0);
    } finally {
      await table.drop(db);
      await expect(query.execute()).rejects.toThrow("does not exist");
    }
  });

  it("doesn't allow maxPublicPermissions to exceed maxUserGrantedPermissions", async () => {
    const makeTable = () =>
      new PermissionsTable({
        ...getIntKeyPermissionsTable(),
        maxPublicPermissions: AccessLevel.Write,
        maxUserGrantedPermissions: AccessLevel.Read,
      });
    expect(makeTable).toThrow("maxPublicPermissions");
  });

  it("doesn't allow null user IDs when maxPublicPermissions is 0", async () => {
    const table = new PermissionsTable({
      ...getIntKeyPermissionsTable(),
      maxPublicPermissions: AccessLevel.None,
      maxUserGrantedPermissions: AccessLevel.Write,
      tableName: "custom_permissions_table",
    });
    const db = await initIntKeyDB(table);
    intKeyDB = db; // for cleanup

    try {
      // ensure we can assign permissions to a user
      await table.setPermissions(db, 1, 1, AccessLevel.Read, null);
      await expect(
        db
          .insertInto(table.tableName)
          .values({
            grantedTo: null,
            resourceID: 1,
            permissions: AccessLevel.Read,
            grantedAt: new Date(),
            grantedBy: null,
          })
          .execute()
      ).rejects.toThrow(`null value in column "grantedTo"`);
    } finally {
      await table.drop(intKeyDB);
    }
  });

  it("deletes permissions rows when user is deleted", async () => {
    intKeyDB = await initIntKeyDB(intKeyTable);
    const query = intKeyDB
      .selectFrom(intKeyTable.tableName)
      .select("resourceID")
      .where("grantedTo", "=", 5);

    let rows = await query.execute();
    expect(rows).toHaveLength(2);

    await intKeyDB.deleteFrom("test_users").where("id", "=", 5).execute();

    rows = await query.execute();
    expect(rows).toHaveLength(0);
  });

  it("deletes permissions rows when resource is deleted", async () => {
    intKeyDB = await initIntKeyDB(intKeyTable);
    const query = intKeyDB
      .selectFrom(intKeyTable.tableName)
      .select("grantedTo")
      .where("resourceID", "=", 3);

    let rows = await query.execute();
    expect(rows).toHaveLength(2);

    await intKeyDB.deleteFrom("test_posts").where("postID", "=", 3).execute();

    rows = await query.execute();
    expect(rows).toHaveLength(0);
  });

  it("validates constructor arguments", () => {
    ignore("invalid key data types", () => {
      new PermissionsTable({
        maxPublicPermissions: AccessLevel.Read,
        maxUserGrantedPermissions: AccessLevel.Write,
        userTable: "test_users",
        userIDColumn: "id",
        // @ts-expect-error - invalid key data type
        userIDDataType: "string",
        resourceTable: "test_posts",
        resourceIDColumn: "postID",
        resourceIDDataType: "integer",
      });
      new PermissionsTable({
        ownerPermissions: AccessLevel.Write,
        userTable: "test_users",
        userIDColumn: "id",
        userIDDataType: "integer",
        resourceTable: "test_posts",
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
          userTable: "test_users",
          userIDColumn: "id",
          userIDDataType: "integer",
          resourceTable: "test_posts",
          resourceIDColumn: "postID",
          resourceIDDataType: "integer",
          // @ts-expect-error - user key not of correct type
          sampleUserID: "invalid",
        });
        new PermissionsTable({
          maxPublicPermissions: AccessLevel.Read,
          maxUserGrantedPermissions: AccessLevel.Write,
          userTable: "test_users",
          userIDColumn: "id",
          userIDDataType: "text",
          resourceTable: "test_posts",
          resourceIDColumn: "postID",
          resourceIDDataType: "integer",
          // @ts-expect-error - user key not of correct type
          sampleUserID: 1 as UserID,
        });

        new PermissionsTable({
          maxPublicPermissions: AccessLevel.Read,
          maxUserGrantedPermissions: AccessLevel.Write,
          userTable: "test_users",
          userIDColumn: "id",
          userIDDataType: "integer",
          resourceTable: "test_posts",
          resourceIDColumn: "postID",
          resourceIDDataType: "integer",
          // @ts-expect-error - resource key not of correct type
          sampleResourceID: "invalid",
        });
        new PermissionsTable({
          maxPublicPermissions: AccessLevel.Read,
          maxUserGrantedPermissions: AccessLevel.Write,
          userTable: "test_users",
          userIDColumn: "id",
          userIDDataType: "integer",
          resourceTable: "test_posts",
          resourceIDColumn: "postID",
          resourceIDDataType: "text",
          // @ts-expect-error - resource key not of correct type
          sampleResourceID: 1 as PostID,
        });
      }
    );
  });
});
