import { Kysely } from "kysely";

import {
  IntPostID,
  IntUserID,
  IntKeyDB,
  initIntKeyDB,
  getIntKeyPermissionsTable,
} from "./lib/intkey-tables";
import { AccessLevel, createDatabase, destroyDB } from "./lib/test-util";
import { StrKeyDB, getStrKeyPermissionsTable } from "./lib/strkey-tables";
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

describe("PermissionsTable setPermissions()", () => {
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
