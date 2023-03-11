import { Kysely } from "kysely";

import { createDB, resetDB, destroyDB } from "./utils/test-setup";
import { Database } from "./utils/test-tables";
import { StdUserFacet } from "./utils/test-facets";
import { USERS } from "./utils/test-objects";
import { ignore } from "@fieldzoo/testing-utils";
import { allOf, anyOf } from "../filters/ComboFilter";

let db: Kysely<Database>;
let stdUserFacet: StdUserFacet;

beforeAll(async () => {
  db = await createDB();
  stdUserFacet = new StdUserFacet(db);
});
beforeEach(() => resetDB(db));
afterAll(() => destroyDB(db));

describe("deleting rows via StandardFacet", () => {
  it("deletes rows returning the deletion count", async () => {
    const count1 = await stdUserFacet.delete({ name: USERS[0].name });
    expect(count1).toEqual(0);

    await stdUserFacet.insert(USERS);

    const count2 = await stdUserFacet.delete({ name: USERS[0].name });
    expect(count2).toEqual(2);
    const users = await stdUserFacet.selectMany({});
    expect(users.length).toEqual(1);
    expect(users[0].handle).toEqual(USERS[1].handle);
  });

  it("deletes rows specified via compound filter", async () => {
    await stdUserFacet.insert(USERS);

    const count1 = await stdUserFacet.delete(
      allOf({ name: USERS[0].name }, { handle: USERS[0].handle })
    );
    expect(count1).toEqual(1);

    const count2 = await stdUserFacet.delete(
      anyOf({ name: USERS[0].name }, { handle: USERS[0].handle })
    );
    expect(count2).toEqual(1);
  });

  ignore("detects update() and updateReturning() type errors", async () => {
    // @ts-expect-error - table must have all filter fields
    stdUserFacet.delete({ notThere: "xyz" });
    // @ts-expect-error - table must have all filter fields
    stdUserFacet.delete(["notThere", "=", "foo"]);
    // @ts-expect-error - doesn't allow plain string expression filters
    stdUserFacet.delete("name = 'John Doe'");
    await stdUserFacet.delete(
      // @ts-expect-error - only table columns are accessible via anyOf()
      anyOf({ notThere: "xyz" }, ["alsoNotThere", "=", "Sue"])
    );
    await stdUserFacet.delete(
      // @ts-expect-error - only table columns are accessible via allOf()
      allOf({ notThere: "xyz" }, ["alsoNotThere", "=", "Sue"])
    );
  });
});
