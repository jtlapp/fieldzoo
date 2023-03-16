import { Kysely } from "kysely";

import { createDB, resetDB, destroyDB } from "./utils/test-setup";
import { Database } from "./utils/test-tables";
import { UserTableFacet } from "./utils/test-facets";
import { USERS } from "./utils/test-objects";
import { ignore } from "@fieldzoo/testing-utils";
import { allOf, anyOf } from "../filters/CompoundFilter";

let db: Kysely<Database>;
let userTableFacet: UserTableFacet;

beforeAll(async () => {
  db = await createDB();
  userTableFacet = new UserTableFacet(db);
});
beforeEach(() => resetDB(db));
afterAll(() => destroyDB(db));

it("deleteQB() allows for deleting rows", async () => {
  await userTableFacet.insert(USERS[1]);

  const readUser1 = await userTableFacet.selectOne({ handle: USERS[1].handle });
  expect(readUser1?.handle).toEqual(USERS[1].handle);
  expect(readUser1?.email).toEqual(USERS[1].email);

  const result = await userTableFacet
    .deleteQB()
    .where("handle", "=", USERS[1].handle)
    .executeTakeFirst();
  expect(Number(result.numDeletedRows)).toEqual(1);

  const readUser2 = await userTableFacet.selectOne({ handle: USERS[1].handle });
  expect(readUser2).toBeNull();
});

describe("deleting rows via TableFacet", () => {
  it("deletes rows returning the deletion count", async () => {
    const count1 = await userTableFacet.delete({ name: USERS[0].name });
    expect(count1).toEqual(0);

    await userTableFacet.insert(USERS);

    const count2 = await userTableFacet.delete({ name: USERS[0].name });
    expect(count2).toEqual(2);
    const users = await userTableFacet.selectMany({});
    expect(users.length).toEqual(1);
    expect(users[0].handle).toEqual(USERS[1].handle);
  });

  it("deletes rows specified via compound filter", async () => {
    await userTableFacet.insert(USERS);

    const count1 = await userTableFacet.delete(
      allOf({ name: USERS[0].name }, { handle: USERS[0].handle })
    );
    expect(count1).toEqual(1);

    const count2 = await userTableFacet.delete(
      anyOf({ name: USERS[0].name }, { handle: USERS[0].handle })
    );
    expect(count2).toEqual(1);
  });

  ignore("detects update() and updateReturning() type errors", async () => {
    // @ts-expect-error - table must have all filter fields
    userTableFacet.delete({ notThere: "xyz" });
    // @ts-expect-error - table must have all filter fields
    userTableFacet.delete(["notThere", "=", "foo"]);
    // @ts-expect-error - doesn't allow plain string expression filters
    userTableFacet.delete("name = 'John Doe'");
    await userTableFacet.delete(
      // @ts-expect-error - only table columns are accessible via anyOf()
      anyOf({ notThere: "xyz" }, ["alsoNotThere", "=", "Sue"])
    );
    await userTableFacet.delete(
      // @ts-expect-error - only table columns are accessible via allOf()
      allOf({ notThere: "xyz" }, ["alsoNotThere", "=", "Sue"])
    );
  });
});
