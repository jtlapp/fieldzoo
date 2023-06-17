import { Kysely } from "kysely";

import {
  IntPostID,
  IntUserID,
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
import {
  StrKeyDB,
  StrPostID,
  StrUserID,
  getStrKeyPermissionsTable,
  initStrKeyDB,
} from "./lib/strkey-tables";
import { checkPermissions } from "./lib/check-permissions";

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

describe("PermissionsTable removePermissions()", () => {
  describe("with integer keys", () => {
    it("removes existing permissions", async () => {
      intKeyDB = await initIntKeyDB(intKeyTable);

      // verify original permissions

      await checkPermissions(intKeyDB, 4 as IntUserID, intKeyTable, [
        [1, AccessLevel.Read, null],
        [2, AccessLevel.None, null],
        [3, AccessLevel.None, null],
        [4, AccessLevel.Owner, null],
      ]);

      // test removing permissions

      await intKeyTable.removePermissions(
        intKeyDB,
        4 as IntUserID,
        1 as IntPostID
      );
      await checkPermissions(intKeyDB, 4 as IntUserID, intKeyTable, [
        [1, AccessLevel.None, null],
        [2, AccessLevel.None, null],
        [3, AccessLevel.None, null],
        [4, AccessLevel.Owner, null],
      ]);
    });

    it("ignores removing non-existing permissions", async () => {
      intKeyDB = await initIntKeyDB(intKeyTable);

      await intKeyTable.removePermissions(
        intKeyDB,
        4 as IntUserID,
        2 as IntPostID
      );
      await checkPermissions(intKeyDB, 4 as IntUserID, intKeyTable, [
        [1, AccessLevel.Read, null],
        [2, AccessLevel.None, null],
        [3, AccessLevel.None, null],
        [4, AccessLevel.Owner, null],
      ]);
    });

    it("removing public permissions surfaces lower permissions", async () => {
      intKeyDB = await initIntKeyDB(intKeyTable);

      // verify original permissions

      await checkPermissions(intKeyDB, 1 as IntUserID, intKeyTable, [
        [1, AccessLevel.None, null],
        [2, AccessLevel.None, null],
        [3, AccessLevel.None, null],
        [4, AccessLevel.None, null],
      ]);

      // test with public permissions, overriding 0 permissions

      await intKeyTable.setPermissions(
        intKeyDB,
        null,
        1 as IntPostID,
        AccessLevel.Read,
        null
      );
      await checkPermissions(intKeyDB, 1 as IntUserID, intKeyTable, [
        [1, AccessLevel.Read, null],
        [2, AccessLevel.None, null],
        [3, AccessLevel.None, null],
        [4, AccessLevel.None, null],
      ]);

      // test removing public permissions, should revert to original permissions

      await intKeyTable.removePermissions(intKeyDB, null, 1 as IntPostID);
      await checkPermissions(intKeyDB, 1 as IntUserID, intKeyTable, [
        [1, AccessLevel.None, null],
        [2, AccessLevel.None, null],
        [3, AccessLevel.None, null],
        [4, AccessLevel.None, null],
      ]);
    });

    ignore("requires provided key types", () => {
      intKeyTable.removePermissions(
        intKeyDB,
        // @ts-expect-error - user key not of correct type
        1,
        1 as IntPostID
      );
      intKeyTable.removePermissions(
        intKeyDB,
        // @ts-expect-error - user key not of correct type
        "u1",
        1 as IntPostID
      );

      intKeyTable.removePermissions(
        intKeyDB,
        1 as IntUserID,
        // @ts-expect-error - resource key not of correct type
        1
      );
      intKeyTable.removePermissions(
        intKeyDB,
        1 as IntUserID,
        // @ts-expect-error - resource key not of correct type
        "p1"
      );
    });
  });

  describe("with string keys", () => {
    it("removes existing permissions", async () => {
      strKeyDB = await initStrKeyDB(strKeyTable);

      // verify original permissions

      await checkPermissions(strKeyDB, "u1" as StrUserID, strKeyTable, [
        ["p1", AccessLevel.Owner, null],
        ["p2", AccessLevel.Read, "u2" as StrUserID],
        ["p3", AccessLevel.None, null],
      ]);

      // test removing permissions

      await strKeyTable.removePermissions(
        strKeyDB,
        "u1" as StrUserID,
        "p2" as StrPostID
      );
      await checkPermissions(strKeyDB, "u1" as StrUserID, strKeyTable, [
        ["p1", AccessLevel.Owner, null],
        ["p2", AccessLevel.None, null],
        ["p3", AccessLevel.None, null],
      ]);
    });

    ignore("requires provided key types", () => {
      strKeyTable.removePermissions(
        strKeyDB,
        // @ts-expect-error - user key not of correct type
        1,
        "p1" as StrPostID
      );
      strKeyTable.removePermissions(
        strKeyDB,
        // @ts-expect-error - user key not of correct type
        "u1",
        "p1" as StrPostID
      );

      strKeyTable.removePermissions(
        strKeyDB,
        "u1" as StrUserID,
        // @ts-expect-error - resource key not of correct type
        1
      );
      strKeyTable.removePermissions(
        strKeyDB,
        "u1" as StrUserID,
        // @ts-expect-error - resource key not of correct type
        "p1"
      );
    });
  });
});
