import { Kysely } from "kysely";

import { createDB, resetDB, destroyDB } from "./utils/test-setup";
import { Database } from "./utils/test-tables";
import { UserTableLensReturningAll } from "./utils/test-lenses";
import { USERS } from "./utils/test-objects";
import { ignore } from "./utils/test-utils";

let db: Kysely<Database>;
let userLens: UserTableLensReturningAll;

beforeAll(async () => {
  db = await createDB();
  userLens = new UserTableLensReturningAll(db);
});
beforeEach(() => resetDB(db));
afterAll(() => destroyDB(db));

it("deleteQB() allows for deleting rows", async () => {
  await userLens.insert(USERS[1]);

  const readUser1 = await userLens.selectOne({ handle: USERS[1].handle });
  expect(readUser1?.handle).toEqual(USERS[1].handle);
  expect(readUser1?.email).toEqual(USERS[1].email);

  const result = await userLens
    .deleteQB()
    .where("handle", "=", USERS[1].handle)
    .executeTakeFirst();
  expect(Number(result.numDeletedRows)).toEqual(1);

  const readUser2 = await userLens.selectOne({ handle: USERS[1].handle });
  expect(readUser2).toBeNull();
});

describe("deleting rows via TableLens", () => {
  it("deletes rows returning the deletion count", async () => {
    const count1 = await userLens.deleteWhere({ name: USERS[0].name });
    expect(count1).toEqual(0);

    await userLens.insert(USERS);

    const count2 = await userLens.deleteWhere({ name: USERS[0].name });
    expect(count2).toEqual(2);
    const users = await userLens.selectMany({});
    expect(users.length).toEqual(1);
    expect(users[0].handle).toEqual(USERS[1].handle);
  });

  it("deletes rows specified via compound filter", async () => {
    await userLens.insert(USERS);

    const count1 = await userLens.deleteWhere(({ and, cmpr }) =>
      and([
        cmpr("name", "=", USERS[0].name),
        cmpr("handle", "=", USERS[0].handle),
      ])
    );
    expect(count1).toEqual(1);

    const count2 = await userLens.deleteWhere(({ or, cmpr }) =>
      or([
        cmpr("name", "=", USERS[0].name),
        cmpr("handle", "=", USERS[0].handle),
      ])
    );
    expect(count2).toEqual(1);
  });

  ignore("detects delete() type errors", async () => {
    // @ts-expect-error - table must have all filter fields
    userLens.deleteWhere({ notThere: "xyz" });
    // @ts-expect-error - table must have all filter fields
    userLens.deleteWhere(["notThere", "=", "foo"]);
    // @ts-expect-error - doesn't allow plain string expression filters
    userLens.deleteWhere("name = 'John Doe'");
    await userLens.deleteWhere(({ or, cmpr }) =>
      // @ts-expect-error - only table columns are accessible via anyOf()
      or([cmpr("notThere", "=", "xyz"), cmpr("alsoNotThere", "=", "Sue")])
    );
    await userLens.deleteWhere(({ or, cmpr }) =>
      // @ts-expect-error - only table columns are accessible via allOf()
      or([cmpr("notThere", "=", "xyz"), cmpr("alsoNotThere", "=", "Sue")])
    );
  });
});
