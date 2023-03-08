import { Insertable, Kysely, Selectable } from "kysely";

import { StandardFacet } from "..";
import { createDB, resetDB, destroyDB } from "./utils/test-setup";
import { Database } from "./utils/test-tables";
import { PassThruUserFacet, PassThruPostFacet } from "./utils/test-facets";
import { USERS, POSTS } from "./utils/test-objects";
import { ignore } from "@fieldzoo/testing-utils";
import {
  SelectedUser,
  InsertedUser,
  InsertReturnedUser,
} from "./utils/test-types";

let db: Kysely<Database>;
let plainUserFacet: PassThruUserFacet;
let plainPostFacet: PassThruPostFacet;

beforeAll(async () => {
  db = await createDB();
  plainUserFacet = new PassThruUserFacet(db);
  plainPostFacet = new PassThruPostFacet(db);
});
beforeEach(() => resetDB(db));
afterAll(() => destroyDB(db));

describe("insertMany() without transformation", () => {
  it("inserts rows without returning columns", async () => {
    const result = await plainUserFacet.insertMany(USERS);
    expect(result).toBeUndefined();

    const readUsers = await plainUserFacet.selectMany({});
    expect(readUsers.length).toEqual(3);
    for (let i = 0; i < USERS.length; i++) {
      expect(readUsers[i].handle).toEqual(USERS[i].handle);
    }
  });

  it("inserts rows returning indicated columns", async () => {
    const insertReturns = await plainUserFacet.insertMany(USERS, ["id"]);
    expect(insertReturns.length).toEqual(3);
    for (let i = 0; i < USERS.length; i++) {
      expect(insertReturns[i].id).toBeGreaterThan(0);
      expect(Object.keys(insertReturns[i]).length).toEqual(1);
    }

    const readUsers = await plainUserFacet.selectMany({});
    expect(readUsers.length).toEqual(3);
    for (let i = 0; i < USERS.length; i++) {
      expect(readUsers[i].handle).toEqual(USERS[i].handle);
    }

    const post0 = Object.assign({}, POSTS[0], { userId: insertReturns[0].id });
    const post1 = Object.assign({}, POSTS[1], { userId: insertReturns[1].id });
    const post2 = Object.assign({}, POSTS[2], { userId: insertReturns[2].id });
    const updatedPosts = await plainPostFacet.insertMany(
      [post0, post1, post2],
      ["id", "createdAt"]
    );
    expect(updatedPosts.length).toEqual(3);
    for (let i = 0; i < updatedPosts.length; i++) {
      expect(updatedPosts[i].id).toBeGreaterThan(0);
      expect(new Date(updatedPosts[i].createdAt)).not.toBeNaN();
      expect(Object.keys(updatedPosts[i]).length).toEqual(2);
    }
  });

  it("inserts rows returning all columns", async () => {
    const insertReturns = await plainUserFacet.insertMany(USERS, ["*"]);
    for (let i = 0; i < USERS.length; i++) {
      expect(insertReturns[i].id).toBeGreaterThan(0);
    }
    expect(insertReturns).toEqual(
      USERS.map((user, i) =>
        Object.assign({}, user, { id: insertReturns[i].id })
      )
    );
  });

  it("errors when insert requests an empty list of returns", async () => {
    expect(plainUserFacet.insertMany(USERS, [])).rejects.toThrow(
      "'returning' cannot be an empty array"
    );

    const readUsers = await plainUserFacet.selectMany({});
    expect(readUsers.length).toEqual(0);
  });

  ignore("detects insertMany() type errors", async () => {
    // @ts-expect-error - returns undefined without returning argument
    plainUserFacet.insertMany([USERS[0]]).email;
    // @ts-expect-error - inserted object must have all required columns
    plainUserFacet.insertMany([{}]);
    // @ts-expect-error - inserted object must have all required columns
    plainUserFacet.insertMany([{ email: "xyz@pdq.xyz" }]);
    // @ts-expect-error - returning argument can't be a string
    plainUserFacet.insertMany([USERS[0]], "id");
    // @ts-expect-error - returning argument can't be a string
    plainUserFacet.insertMany([USERS[0]], "*");
    // @ts-expect-error - returning arguments must be valid column names
    plainUserFacet.insertMany([USERS[0]], [""]);
    // @ts-expect-error - returning arguments must be valid column names
    plainUserFacet.insertMany([USERS[0]], ["notThere"]);
    // @ts-expect-error - returning arguments must be valid column names
    plainUserFacet.insertMany([USERS[0]], ["notThere", "*"]);
    // @ts-expect-error - only requested columns are returned
    (await plainUserFacet.insertMany([USERS[0]], ["id"]))[0].handle;
  });
});

describe("insertOne() without transformation", () => {
  it("inserts a row without returning columns", async () => {
    const result = await plainUserFacet.insertOne(USERS[0]);
    expect(result).toBeUndefined();

    const readUser0 = await plainUserFacet
      .selectRows()
      .where("email", "=", USERS[0].email)
      .executeTakeFirst();
    expect(readUser0?.email).toEqual(USERS[0].email);
  });

  it("inserts one returning indicated columns", async () => {
    const insertReturn = await plainUserFacet.insertOne(USERS[0], ["id"]);
    expect(insertReturn.id).toBeGreaterThan(0);
    expect(Object.keys(insertReturn).length).toEqual(1);

    const readUser0 = await plainUserFacet
      .selectRows()
      .where("id", "=", insertReturn.id)
      .executeTakeFirst();
    expect(readUser0?.email).toEqual(USERS[0].email);

    const post0 = Object.assign({}, POSTS[0], { userId: insertReturn.id });
    const updatedPost = await plainPostFacet.insertOne(post0, [
      "id",
      "createdAt",
    ]);
    expect(updatedPost.id).toBeGreaterThan(0);
    expect(new Date(updatedPost.createdAt)).not.toBeNaN();
    expect(Object.keys(updatedPost).length).toEqual(2);

    const readPost0 = await plainPostFacet
      .selectRows()
      .where("id", "=", updatedPost.id)
      .where("createdAt", "=", updatedPost.createdAt)
      .executeTakeFirst();
    expect(readPost0?.title).toEqual(post0.title);
  });

  it("inserts one returning all columns", async () => {
    const insertReturn = await plainUserFacet.insertOne(USERS[0], ["*"]);
    expect(insertReturn.id).toBeGreaterThan(0);
    const expectedUser = Object.assign({}, USERS[0], { id: insertReturn.id });
    expect(insertReturn).toEqual(expectedUser);
  });

  it("errors when insert requests an empty list of returns", async () => {
    expect(plainUserFacet.insertOne(USERS[0], [])).rejects.toThrow(
      "'returning' cannot be an empty array"
    );

    const readUsers = await plainUserFacet.selectMany({});
    expect(readUsers.length).toEqual(0);
  });

  ignore("detects insertOne() type errors", async () => {
    // @ts-expect-error - returns undefined without returning argument
    plainUserFacet.insertOne([USERS[0]]).email;
    // @ts-expect-error - inserted object must have all required columns
    plainUserFacet.insertOne({});
    // @ts-expect-error - inserted object must have all required columns
    plainUserFacet.insertOne({ email: "xyz@pdq.xyz" });
    // @ts-expect-error - returning argument can't be a string
    plainUserFacet.insertOne(USERS[0], "id");
    // @ts-expect-error - returning argument can't be a string
    plainUserFacet.insertOne(USERS[0], "*");
    // @ts-expect-error - returning arguments must be valid column names
    plainUserFacet.insertOne(USERS[0], [""]);
    // @ts-expect-error - returning arguments must be valid column names
    plainUserFacet.insertOne(USERS[0], ["notThere"]);
    // @ts-expect-error - returning arguments must be valid column names
    plainUserFacet.insertOne(USERS[0], ["notThere", "*"]);
    // @ts-expect-error - only requested columns are returned
    (await plainUserFacet.insertOne(USERS[0], ["id", "email"])).name;
  });
});

describe("insertion transformation", () => {
  const user1 = new InsertedUser(
    0,
    "John",
    "Smith",
    "jsmith",
    "jsmith@xyz.pdq"
  );
  const user2 = new InsertedUser(0, "Jane", "Doe", "jdoe", "jdoe@xyz.pdq");
  const user3 = new InsertedUser(0, "Mary", "Sue", "msue", "msue@xyz.pdq");

  class InsertTransformFacet extends StandardFacet<
    Database,
    "users",
    Selectable<Database["users"]>,
    InsertedUser
  > {
    constructor(db: Kysely<Database>) {
      super(db, "users", {
        insertTransform: (source) => ({
          name: `${source.firstName} ${source.lastName}`,
          handle: source.handle,
          email: source.email,
        }),
      });
    }
  }

  it("transforms users for insertion without transforming return", async () => {
    const insertTransformFacet = new InsertTransformFacet(db);

    const insertReturn = await insertTransformFacet.insertOne(user1, ["id"]);
    const readUser1 = await insertTransformFacet.selectOne({
      id: insertReturn.id,
    });
    expect(readUser1?.name).toEqual(`${user1.firstName} ${user1.lastName}`);

    await insertTransformFacet.insertMany([user2, user3], ["id"]);
    const readUsers = await insertTransformFacet.selectMany([
      "id",
      ">",
      insertReturn.id,
    ]);
    expect(readUsers.length).toEqual(2);
    expect(readUsers[0].name).toEqual(`${user2.firstName} ${user2.lastName}`);
    expect(readUsers[1].name).toEqual(`${user3.firstName} ${user3.lastName}`);
  });

  it("transforms insertion return without transforming insertion", async () => {
    class InsertReturnTransformFacet extends StandardFacet<
      Database,
      "users",
      Selectable<Database["users"]>,
      Insertable<Database["users"]>,
      Partial<Insertable<Database["users"]>>,
      InsertReturnedUser
    > {
      constructor(db: Kysely<Database>) {
        super(db, "users", {
          defaultInsertReturns: ["id"],
          insertReturnTransform: (source, returns) =>
            new InsertReturnedUser(
              returns.id!,
              source.name.split(" ")[0],
              source.name.split(" ")[1],
              source.handle,
              source.email
            ),
        });
      }
    }
    const user1 = {
      name: "John Smith",
      handle: "jsmith",
      email: "jsmith@xyz.pdq",
    };
    const user2 = {
      name: "Jane Doe",
      handle: "jdoe",
      email: "jdoe@xyz.pdq",
    };
    const user3 = {
      name: "Mary Sue",
      handle: "msue",
      email: "msue@xyz.pdq",
    };
    const insertReturnTransformFacet = new InsertReturnTransformFacet(db);

    const insertReturn = await insertReturnTransformFacet.insertOne(user1);
    expect(insertReturn).toEqual(
      new InsertReturnedUser(1, "John", "Smith", "jsmith", "jsmith@xyz.pdq")
    );

    const insertReturns = await insertReturnTransformFacet.insertMany([
      user2,
      user3,
    ]);
    expect(insertReturns).toEqual([
      new InsertReturnedUser(2, "Jane", "Doe", "jdoe", "jdoe@xyz.pdq"),
      new InsertReturnedUser(3, "Mary", "Sue", "msue", "msue@xyz.pdq"),
    ]);
  });

  it("transforms insertion and insertion return", async () => {
    class InsertAndReturnTransformFacet extends StandardFacet<
      Database,
      "users",
      Selectable<Database["users"]>,
      InsertedUser,
      Partial<Insertable<Database["users"]>>,
      InsertReturnedUser
    > {
      constructor(db: Kysely<Database>) {
        super(db, "users", {
          insertTransform: (source) => ({
            name: `${source.firstName} ${source.lastName}`,
            handle: source.handle,
            email: source.email,
          }),
          defaultInsertReturns: ["id"],
          insertReturnTransform: (source, returns) =>
            new InsertReturnedUser(
              returns.id!,
              source.firstName,
              source.lastName,
              source.handle,
              source.email
            ),
        });
      }
    }
    const user = new InsertedUser(
      0,
      "John",
      "Smith",
      "jsmith",
      "jsmith@xyz.pdq"
    );

    const insertAndReturnTransformFacet = new InsertAndReturnTransformFacet(db);
    const insertReturn = await insertAndReturnTransformFacet.insertOne(user);
    expect(insertReturn).toEqual(
      new InsertReturnedUser(1, "John", "Smith", "jsmith", "jsmith@xyz.pdq")
    );

    // TODO: add test for insertMany
  });

  it("errors when providing an empty defaultInsertReturns array", () => {
    expect(
      () =>
        new StandardFacet(db, "users", {
          insertReturnTransform: (source, _returns) => source,
          defaultInsertReturns: [],
        })
    ).toThrow("'defaultInsertReturns' cannot be an empty array");
  });

  it("errors when providing only one of insertReturnTransform and defaultInsertReturns", () => {
    expect(
      () =>
        new StandardFacet(db, "users", {
          insertReturnTransform: (source, _returns) => source,
        })
    ).toThrow("'insertReturnTransform' requires 'defaultInsertReturns'");
    expect(
      () =>
        new StandardFacet(db, "users", {
          defaultInsertReturns: ["id"],
        })
    ).toThrow("'defaultInsertReturns' requires 'insertReturnTransform'");
  });

  ignore("detects insertion transformation type errors", async () => {
    const insertTransformFacet = new InsertTransformFacet(db);
    const selectedUser = new SelectedUser(
      0,
      "John",
      "Doe",
      "jdoe",
      "jdoe@xyz.pdq"
    );

    // @ts-expect-error - requires InsertedType as input
    await insertTransformFacet.insertOne(USERS[0]);
    // @ts-expect-error - requires InsertedType as input
    await insertTransformFacet.insertOne(selectedUser);
  });
});
