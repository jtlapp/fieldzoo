import { Kysely } from "kysely";

import {
  IntKeyDB,
  createIntKeyDB,
  getIntKeyPermissionsTable,
} from "./lib/intkey-tables";
import { AccessLevel, createDatabase, destroyDB } from "./lib/test-util";
import { PermissionsTable } from "../lib/permissions-table";
import {
  StrKeyDB,
  createStrKeyDB,
  getStrKeyPermissionsTable,
} from "./lib/strkey-tables";

type IntUserID = number & { readonly __brand: unique symbol };
type IntPostID = number & { readonly __brand: unique symbol };

type StrUserID = string & { readonly __brand: unique symbol };
type StrPostID = string & { readonly __brand: unique symbol };

let intKeyDB: Kysely<IntKeyDB>;
const intKeyTable = getIntKeyPermissionsTable<IntUserID, IntPostID>();
let strKeyDB: Kysely<StrKeyDB>;
const strKeyTable = getStrKeyPermissionsTable<StrUserID, StrPostID>();

async function initIntKeyDB() {
  intKeyDB = await createIntKeyDB(intKeyTable);

  await intKeyDB
    .insertInto("users")
    .values([
      // user1 has no access to any posts
      { handle: "user1", name: "User 1" },
      // user2 owns post 1, but no assigned permissionss
      { handle: "user2", name: "User 2" },
      // user3 owns post 2 and post 3, but no assigned permissionss
      { handle: "user3", name: "User 3" },
      // user4 owns post 4 and has read access to post 1
      { handle: "user4", name: "User 4" },
      // user5 owns no posts, has read access to post 2, write access to post 3
      { handle: "user5", name: "User 5" },
    ])
    .execute();

  // posts
  await intKeyDB
    .insertInto("posts")
    .values([
      { ownerID: 2, title: "Post 1" },
      { ownerID: 3, title: "Post 2" },
      { ownerID: 3, title: "Post 3" },
      { ownerID: 4, title: "Post 4" },
    ])
    .execute();

  // permissions assignments
  await intKeyTable.setPermissions(
    intKeyDB,
    2 as IntUserID,
    1 as IntPostID,
    AccessLevel.Owner,
    null
  );
  await intKeyTable.setPermissions(
    intKeyDB,
    3 as IntUserID,
    2 as IntPostID,
    AccessLevel.Owner,
    null
  );
  await intKeyTable.setPermissions(
    intKeyDB,
    3 as IntUserID,
    3 as IntPostID,
    AccessLevel.Owner,
    null
  );
  await intKeyTable.setPermissions(
    intKeyDB,
    4 as IntUserID,
    4 as IntPostID,
    AccessLevel.Owner,
    null
  );
  await intKeyTable.setPermissions(
    intKeyDB,
    4 as IntUserID,
    1 as IntPostID,
    AccessLevel.Read,
    null
  );
  await intKeyTable.setPermissions(
    intKeyDB,
    5 as IntUserID,
    2 as IntPostID,
    AccessLevel.Read,
    null
  );
  await intKeyTable.setPermissions(
    intKeyDB,
    5 as IntUserID,
    3 as IntPostID,
    AccessLevel.Write,
    1 as IntUserID
  );
}

async function initStrKeyDB() {
  strKeyDB = await createStrKeyDB(strKeyTable);

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
  await strKeyTable.setPermissions(
    strKeyDB,
    "u1" as StrUserID,
    "p1" as StrPostID,
    AccessLevel.Owner,
    null
  );
  await strKeyTable.setPermissions(
    strKeyDB,
    "u1" as StrUserID,
    "p2" as StrPostID,
    AccessLevel.Read,
    "u2" as StrUserID
  );
}

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

describe("PermissionsTable", () => {
  describe("getPermissions()", () => {
    describe("with integer keys", () => {
      it("grants no access when no rights", async () => {
        await initIntKeyDB();
        await checkPermissions(intKeyDB, 1 as IntUserID, intKeyTable, [
          [1, AccessLevel.None, null],
          [2, AccessLevel.None, null],
          [3, AccessLevel.None, null],
          [4, AccessLevel.None, null],
        ]);
      });

      it("grants access to the resource owner", async () => {
        await initIntKeyDB();
        await checkPermissions(intKeyDB, 2 as IntUserID, intKeyTable, [
          [1, AccessLevel.Owner, null],
          [2, AccessLevel.None, null],
          [3, AccessLevel.None, null],
          [4, AccessLevel.None, null],
        ]);

        await checkPermissions(intKeyDB, 3 as IntUserID, intKeyTable, [
          [1, AccessLevel.None, null],
          [2, AccessLevel.Owner, null],
          [3, AccessLevel.Owner, null],
          [4, AccessLevel.None, null],
        ]);
      });

      it("grants access to users by permissions, but no higher", async () => {
        await initIntKeyDB();
        await checkPermissions(intKeyDB, 4 as IntUserID, intKeyTable, [
          [1, AccessLevel.Read, null],
          [2, AccessLevel.None, null],
          [3, AccessLevel.None, null],
          [4, AccessLevel.Owner, null],
        ]);
      });

      it("grants access to assigned permissions and lower", async () => {
        await initIntKeyDB();
        await checkPermissions(intKeyDB, 5 as IntUserID, intKeyTable, [
          [1, AccessLevel.None, null],
          [2, AccessLevel.Read, null],
          [3, AccessLevel.Write, 1 as IntUserID],
          [4, AccessLevel.None, null],
        ]);
      });
    });

    describe("with string keys", () => {
      it("grants access by resource owner and permissions", async () => {
        await initStrKeyDB();
        await checkPermissions(strKeyDB, "u1" as StrUserID, strKeyTable, [
          ["p1", AccessLevel.Owner, null],
          ["p2", AccessLevel.Read, "u2" as StrUserID],
          ["p3", AccessLevel.None, null],
        ]);
      });
    });
  });

  describe("setPermissions()", () => {
    it("setting permissions to 0 reduces access to public permissions", async () => {
      await initIntKeyDB();

      // test without public permissions

      await intKeyTable.setPermissions(
        intKeyDB,
        4 as IntUserID,
        1 as IntPostID,
        AccessLevel.None,
        null
      );
      await checkPermissions(intKeyDB, 4 as IntUserID, intKeyTable, [
        [1, AccessLevel.None, null],
        [2, AccessLevel.None, null],
        [3, AccessLevel.None, null],
        [4, AccessLevel.Owner, null],
      ]);

      // test with public permissions, granted by user 2, overriding 0 permissions

      await intKeyTable.setPermissions(
        intKeyDB,
        null,
        1 as IntPostID,
        AccessLevel.Read,
        2 as IntUserID
      );
      await checkPermissions(intKeyDB, 4 as IntUserID, intKeyTable, [
        [1, AccessLevel.Read, 2 as IntUserID],
        [2, AccessLevel.None, null],
        [3, AccessLevel.None, null],
        [4, AccessLevel.Owner, null],
      ]);

      // test with public permissions, granted by system

      await intKeyTable.setPermissions(
        intKeyDB,
        null,
        1 as IntPostID,
        AccessLevel.None,
        null
      );
      await checkPermissions(intKeyDB, 4 as IntUserID, intKeyTable, [
        [1, AccessLevel.None, null],
        [2, AccessLevel.None, null],
        [3, AccessLevel.None, null],
        [4, AccessLevel.Owner, null],
      ]);
    });

    it("changes existing permissions", async () => {
      await initIntKeyDB();

      // test with a first user increasing permissions

      await intKeyTable.setPermissions(
        intKeyDB,
        4 as IntUserID,
        1 as IntPostID,
        AccessLevel.Write,
        2 as IntUserID
      );
      await checkPermissions(intKeyDB, 4 as IntUserID, intKeyTable, [
        [1, AccessLevel.Write, 2 as IntUserID],
        [2, AccessLevel.None, null],
        [3, AccessLevel.None, null],
        [4, AccessLevel.Owner, null],
      ]);

      // test with a second user decreasing permissions

      await intKeyTable.setPermissions(
        intKeyDB,
        4 as IntUserID,
        1 as IntPostID,
        AccessLevel.Read,
        3 as IntUserID
      );
      await checkPermissions(intKeyDB, 4 as IntUserID, intKeyTable, [
        [1, AccessLevel.Read, 3 as IntUserID],
        [2, AccessLevel.None, null],
        [3, AccessLevel.None, null],
        [4, AccessLevel.Owner, null],
      ]);

      // test with system zeroing permissions

      await intKeyTable.setPermissions(
        intKeyDB,
        4 as IntUserID,
        1 as IntPostID,
        AccessLevel.None,
        null
      );
      await checkPermissions(intKeyDB, 4 as IntUserID, intKeyTable, [
        [1, AccessLevel.None, null],
        [2, AccessLevel.None, null],
        [3, AccessLevel.None, null],
        [4, AccessLevel.Owner, null],
      ]);
    });
  });

  describe("cascade deletes permissions", () => {
    it("deletes permissions rows when user is deleted", async () => {
      await initIntKeyDB();
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
      await initIntKeyDB();
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

async function checkPermissions<
  UserID extends string | number,
  ResourceID extends string | number
>(
  db: Kysely<any>,
  userID: UserID,
  table: PermissionsTable<any, any, any, any, any>,
  expectedResults: [ResourceID, AccessLevel, UserID | null][]
) {
  // test getPermissions() for a single resource

  for (const expectedResult of expectedResults) {
    const accessLevel = await table.getPermissions(
      db,
      userID,
      expectedResult[0]
    );
    expect(accessLevel).toBe(expectedResult[1]);
  }

  // test getPermissions() for all but last resource, in order

  const expectedResults1 = expectedResults.slice(0, -1);
  const permissions1 = await table.getPermissions(
    db,
    userID,
    expectedResults1.map((r) => r[0])
  );
  expect(permissions1).toEqual(
    expectedResults1.map((result) => ({
      resourceID: result[0],
      permissions: result[1],
      grantedBy: result[2],
    }))
  );

  // test getPermissions() for all but first resource, in reverse order

  const expectedResults2 = expectedResults.slice(1).reverse();
  const permissions2 = await table.getPermissions(
    db,
    userID,
    expectedResults2.map((r) => r[0])
  );
  expect(permissions2).toEqual(
    expectedResults2.reverse().map((result) => ({
      resourceID: result[0],
      permissions: result[1],
      grantedBy: result[2],
    }))
  );
}
