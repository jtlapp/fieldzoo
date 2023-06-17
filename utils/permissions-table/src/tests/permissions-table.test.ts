import { Kysely } from "kysely";

import {
  IntKeyDB,
  initIntKeyDB,
  getIntKeyPermissionsTable,
} from "./lib/intkey-tables";
import {
  AccessLevel,
  createDatabase,
  destroyDB,
  ignore,
} from "./lib/test-util";
import { PermissionsTable } from "../lib/permissions-table";
import {
  StrKeyDB,
  initStrKeyDB,
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
        intKeyDB = await initIntKeyDB(intKeyTable);
        await checkPermissions(intKeyDB, 1 as IntUserID, intKeyTable, [
          [1, AccessLevel.None, null],
          [2, AccessLevel.None, null],
          [3, AccessLevel.None, null],
          [4, AccessLevel.None, null],
        ]);
      });

      it("grants access to the resource owner", async () => {
        intKeyDB = await initIntKeyDB(intKeyTable);
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
        intKeyDB = await initIntKeyDB(intKeyTable);
        await checkPermissions(intKeyDB, 4 as IntUserID, intKeyTable, [
          [1, AccessLevel.Read, null],
          [2, AccessLevel.None, null],
          [3, AccessLevel.None, null],
          [4, AccessLevel.Owner, null],
        ]);
      });

      it("grants access to assigned permissions and lower", async () => {
        intKeyDB = await initIntKeyDB(intKeyTable);
        await checkPermissions(intKeyDB, 5 as IntUserID, intKeyTable, [
          [1, AccessLevel.None, null],
          [2, AccessLevel.Read, null],
          [3, AccessLevel.Write, 1 as IntUserID],
          [4, AccessLevel.None, null],
        ]);
      });

      ignore("getPermissions() requires provided key types", () => {
        intKeyTable.getPermissions(
          intKeyDB,
          // @ts-expect-error - user key not of correct type
          "u1",
          strKeyDB.selectFrom("posts")
        );

        intKeyTable.getPermissions(
          intKeyDB,
          // @ts-expect-error - user key not of correct type
          1,
          strKeyDB.selectFrom("posts")
        );
      });

      ignore("setPermissions() requires provided key types", () => {
        intKeyTable.setPermissions(
          intKeyDB,
          // @ts-expect-error - user key not of correct type
          1,
          1 as IntPostID,
          AccessLevel.Read,
          null
        );
        intKeyTable.setPermissions(
          intKeyDB,
          // @ts-expect-error - user key not of correct type
          "u1",
          1 as IntPostID,
          AccessLevel.Read,
          null
        );

        intKeyTable.setPermissions(
          intKeyDB,
          1 as IntUserID,
          // @ts-expect-error - resource key not of correct type
          1,
          AccessLevel.Read,
          null
        );
        intKeyTable.setPermissions(
          intKeyDB,
          1 as IntUserID,
          // @ts-expect-error - resource key not of correct type
          "p1",
          AccessLevel.Read,
          null
        );

        intKeyTable.setPermissions(
          intKeyDB,
          1 as IntUserID,
          1 as IntPostID,
          // @ts-expect-error - permissions not of correct type
          0,
          null
        );

        intKeyTable.setPermissions(
          intKeyDB,
          1 as IntUserID,
          1 as IntPostID,
          AccessLevel.Read,
          // @ts-expect-error - user key not of correct type
          1
        );

        intKeyTable.setPermissions(
          intKeyDB,
          1 as IntUserID,
          1 as IntPostID,
          AccessLevel.Read,
          // @ts-expect-error - user key not of correct type
          "u2"
        );
      });
    });

    describe("with string keys", () => {
      it("grants access by resource owner and permissions", async () => {
        strKeyDB = await initStrKeyDB(strKeyTable);
        await checkPermissions(strKeyDB, "u1" as StrUserID, strKeyTable, [
          ["p1", AccessLevel.Owner, null],
          ["p2", AccessLevel.Read, "u2" as StrUserID],
          ["p3", AccessLevel.None, null],
        ]);
      });

      ignore("getPermissions() requires provided key types", () => {
        strKeyTable.getPermissions(
          strKeyDB,
          // @ts-expect-error - user key not of correct type
          1,
          strKeyDB.selectFrom("posts")
        );

        strKeyTable.getPermissions(
          strKeyDB,
          // @ts-expect-error - user key not of correct type
          "u1",
          strKeyDB.selectFrom("posts")
        );
      });
    });

    ignore("setPermissions() requires provided key types", () => {
      strKeyTable.setPermissions(
        strKeyDB,
        // @ts-expect-error - user key not of correct type
        1,
        "p1" as StrPostID,
        AccessLevel.Read,
        null
      );
      strKeyTable.setPermissions(
        strKeyDB,
        // @ts-expect-error - user key not of correct type
        "u1",
        "p1" as StrPostID,
        AccessLevel.Read,
        null
      );

      strKeyTable.setPermissions(
        strKeyDB,
        "u1" as StrUserID,
        // @ts-expect-error - resource key not of correct type
        1,
        AccessLevel.Read,
        null
      );
      strKeyTable.setPermissions(
        strKeyDB,
        "u1" as StrUserID,
        // @ts-expect-error - resource key not of correct type
        "p1",
        AccessLevel.Read,
        null
      );

      strKeyTable.setPermissions(
        strKeyDB,
        "u1" as StrUserID,
        "p1" as StrPostID,
        // @ts-expect-error - permissions not of correct type
        0,
        null
      );

      strKeyTable.setPermissions(
        strKeyDB,
        "u1" as StrUserID,
        "p1" as StrPostID,
        AccessLevel.Read,
        // @ts-expect-error - user key not of correct type
        1
      );

      strKeyTable.setPermissions(
        strKeyDB,
        "u1" as StrUserID,
        "p1" as StrPostID,
        AccessLevel.Read,
        // @ts-expect-error - user key not of correct type
        "u2"
      );
    });
  });

  describe("setPermissions()", () => {
    it("setting permissions to 0 reduces access to public permissions", async () => {
      intKeyDB = await initIntKeyDB(intKeyTable);

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
      intKeyDB = await initIntKeyDB(intKeyTable);

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

async function checkPermissions<
  StrUserID extends string | number,
  ResourceID extends string | number
>(
  db: Kysely<any>,
  userID: StrUserID,
  table: PermissionsTable<any, any, any, any, any>,
  expectedResults: [ResourceID, AccessLevel, StrUserID | null][]
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
