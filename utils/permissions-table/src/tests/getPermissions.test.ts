import { Kysely } from "kysely";

import {
  AccessLevel,
  createDatabase,
  destroyDB,
  ignore,
} from "./lib/test-util";
import {
  IntPostID,
  IntUserID,
  IntKeyDB,
  initIntKeyDB,
  getIntKeyPermissionsTable,
} from "./lib/intkey-tables";
import {
  StrPostID,
  StrUserID,
  StrKeyDB,
  initStrKeyDB,
  getStrKeyPermissionsTable,
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

describe("PermissionsTable getPermissions()", () => {
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
