import { Kysely } from "kysely";

import { createDB, resetDB, destroyDB } from "./utils/test-setup";
import { Database } from "./utils/test-tables";
import { UserTableLensReturningAll } from "./utils/test-lenses";
import { USERS } from "./utils/test-objects";
import { ignore } from "./utils/test-utils";
import { allOf, anyOf } from "../filters/CompoundFilter";

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
    const count1 = await userLens.delete({ name: USERS[0].name });
    expect(count1).toEqual(0);

    await userLens.insert(USERS);

    const count2 = await userLens.delete({ name: USERS[0].name });
    expect(count2).toEqual(2);
    const users = await userLens.selectMany({});
    expect(users.length).toEqual(1);
    expect(users[0].handle).toEqual(USERS[1].handle);
  });

  it("deletes rows specified via compound filter", async () => {
    await userLens.insert(USERS);

    const count1 = await userLens.delete(
      allOf({ name: USERS[0].name }, { handle: USERS[0].handle })
    );
    expect(count1).toEqual(1);

    const count2 = await userLens.delete(
      anyOf({ name: USERS[0].name }, { handle: USERS[0].handle })
    );
    expect(count2).toEqual(1);
  });

  ignore("detects delete() type errors", async () => {
    // @ts-expect-error - table must have all filter fields
    userLens.delete({ notThere: "xyz" });
    // @ts-expect-error - table must have all filter fields
    userLens.delete(["notThere", "=", "foo"]);
    // @ts-expect-error - doesn't allow plain string expression filters
    userLens.delete("name = 'John Doe'");
    await userLens.delete(
      // @ts-expect-error - only table columns are accessible via anyOf()
      anyOf({ notThere: "xyz" }, ["alsoNotThere", "=", "Sue"])
    );
    await userLens.delete(
      // @ts-expect-error - only table columns are accessible via allOf()
      allOf({ notThere: "xyz" }, ["alsoNotThere", "=", "Sue"])
    );
  });
});
