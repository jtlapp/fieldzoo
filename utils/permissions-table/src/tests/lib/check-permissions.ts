import { Kysely } from "kysely";
import { PermissionsTable } from "../../lib/permissions-table";
import { AccessLevel } from "./test-util";

export async function checkPermissions<
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
