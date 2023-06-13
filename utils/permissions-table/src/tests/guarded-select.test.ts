import { Kysely } from "kysely";

import {
  IntKeyDB,
  createIntKeyDB,
  getIntKeyPermissionsTable,
} from "./lib/intkey-tables";
import { AccessLevel, destroyDB, ignore } from "./lib/test-util";
import { testGuardingIntKeySelect } from "./lib/test-intkey-select";
import { testGuardingStrKeySelect } from "./lib/test-strkey-select";
import { StrKeyDB, getStrKeyPermissionsTable } from "./lib/strkey-tables";

type IntUserID = number & { readonly __brand: unique symbol };
type IntPostID = number & { readonly __brand: unique symbol };

type StrUserID = string & { readonly __brand: unique symbol };
type StrPostID = string & { readonly __brand: unique symbol };

describe("PermissionsTable", () => {
  describe("getPermissions()", () => {
    describe("with integer keys", () => {
      let intKeyDB: Kysely<IntKeyDB>;
      const intKeyTable = getIntKeyPermissionsTable<IntUserID, IntPostID>();

      async function initIntKeyDB() {
        intKeyDB = await createIntKeyDB();
        await intKeyTable.create(intKeyDB);

        await intKeyDB
          .insertInto("users")
          .values([
            // user1 has no access to any posts
            { handle: "user1", name: "User 1" },
            // user2 owns post 1, but no assigned permissionss
            { handle: "user2", name: "User 2" },
            // user3 owns post 2 and post 3, but no assigned permissionss
            { handle: "user3", name: "User 3" },
            // user4 owns post 4 and has read access to post 1
            { handle: "user4", name: "User 4" },
            // user5 owns no posts, has read access to post 2, write access to post 3
            { handle: "user5", name: "User 5" },
          ])
          .execute();

        // posts
        await intKeyDB
          .insertInto("posts")
          .values([
            { ownerID: 2, title: "Post 1" },
            { ownerID: 3, title: "Post 2" },
            { ownerID: 3, title: "Post 3" },
            { ownerID: 4, title: "Post 4" },
          ])
          .execute();

        // permissions assignments
        await intKeyTable.setPermissions(
          intKeyDB,
          4 as IntUserID,
          1 as IntPostID,
          AccessLevel.Read
        );
        await intKeyTable.setPermissions(
          intKeyDB,
          5 as IntUserID,
          2 as IntPostID,
          AccessLevel.Read
        );
        await intKeyTable.setPermissions(
          intKeyDB,
          5 as IntUserID,
          3 as IntPostID,
          AccessLevel.Write
        );
      }

      afterEach(async () => {
        if (intKeyDB) {
          await intKeyTable.drop(intKeyDB);
          await destroyDB(intKeyDB);
          intKeyDB = undefined as any;
        }
      });

      it("grants no access when no rights", async () => {
        await initIntKeyDB();
        const query = intKeyDB.selectFrom("posts").selectAll("posts");
        const rows = await intKeyTable
          .getPermissions(intKeyDB, AccessLevel.Write, 1 as IntUserID, query)
          .execute();
        expect(rows).toHaveLength(0);
      });

      it("grants access to the resource owner", async () => {
        await initIntKeyDB();
        const query = intKeyDB.selectFrom("posts").selectAll("posts");
        let rows = await intKeyTable
          .getPermissions(intKeyDB, AccessLevel.Write, 2 as IntUserID, query)
          .execute();
        expect(rows).toHaveLength(1);
        expect(rows[0].title).toBe("Post 1");
        if (checkAccessLevel) {
          expect(rows[0].permissions).toBe(AccessLevel.Write);
        }

        rows = await intKeyTable
          .getPermissions(intKeyDB, AccessLevel.Write, 3 as IntUserID, query)
          .execute();
        expect(rows).toHaveLength(2);
        rows.sort((a, b) => a.postID - b.postID);
        expect(rows[0].title).toBe("Post 2");
        expect(rows[1].title).toBe("Post 3");
        if (checkAccessLevel) {
          expect(rows[0].permissions).toBe(AccessLevel.Write);
          expect(rows[1].permissions).toBe(AccessLevel.Write);
        }
      });

      it("grants access to users by permissions, but no higher", async () => {
        await initIntKeyDB();
        const query = intKeyDB.selectFrom("posts").selectAll("posts");

        // user sees posts to which it has sufficient access

        let rows = await intKeyTable
          .getPermissions(intKeyDB, AccessLevel.Read, 4 as IntUserID, query)
          .execute();
        expect(rows).toHaveLength(2);
        rows.sort((a, b) => a.postID - b.postID);
        expect(rows[0].title).toBe("Post 1");
        expect(rows[1].title).toBe("Post 4");
        if (checkAccessLevel) {
          expect(rows[0].permissions).toBe(AccessLevel.Read);
          expect(rows[1].permissions).toBe(AccessLevel.Write);
        }

        // user does not see posts to which it does not have sufficient access

        rows = await intKeyTable
          .getPermissions(intKeyDB, AccessLevel.Write, 4 as IntUserID, query)
          .execute();
        expect(rows).toHaveLength(1);
        expect(rows[0].title).toBe("Post 4");
        if (checkAccessLevel) {
          expect(rows[0].permissions).toBe(AccessLevel.Write);
        }

        // setting permissions to 0 removes access

        await intKeyTable.setPermissions(
          intKeyDB,
          4 as IntUserID,
          1 as IntPostID,
          AccessLevel.None
        );
        rows = await intKeyTable
          .getPermissions(intKeyDB, AccessLevel.Read, 4 as IntUserID, query)
          .execute();
        expect(rows).toHaveLength(1);
        expect(rows[0].title).toBe("Post 4");
        if (checkAccessLevel) {
          expect(rows[0].permissions).toBe(AccessLevel.Write);
        }
      });

      it("grants access to assigned permissions and lower", async () => {
        await initIntKeyDB();
        const query = intKeyDB.selectFrom("posts").selectAll("posts");

        let rows = await intKeyTable
          .getPermissions(intKeyDB, AccessLevel.Read, 5 as IntUserID, query)
          .execute();
        expect(rows).toHaveLength(2);
        rows.sort((a, b) => a.postID - b.postID);
        expect(rows[0].title).toBe("Post 2");
        expect(rows[1].title).toBe("Post 3");
        if (checkAccessLevel) {
          expect(rows[0].permissions).toBe(AccessLevel.Read);
          expect(rows[1].permissions).toBe(AccessLevel.Write);
        }

        rows = await intKeyTable
          .getPermissions(intKeyDB, AccessLevel.Write, 5 as IntUserID, query)
          .execute();
        expect(rows).toHaveLength(1);
        expect(rows[0].title).toBe("Post 3");
        if (checkAccessLevel) {
          expect(rows[0].permissions).toBe(AccessLevel.Write);
        }
      });

      it("returns a single row or none when query restricted to single row", async () => {
        await initIntKeyDB();
        const queryForPost = (postID: number) =>
          intKeyDB
            .selectFrom("posts")
            .selectAll("posts")
            .where("postID", "=", postID);
        const queryForPost1 = queryForPost(1);
        const queryForPost2 = queryForPost(2);
        const queryForPost4 = queryForPost(4);

        // one post returned if user has sufficient access, returning array

        let rows = await intKeyTable
          .getPermissions(
            intKeyDB,
            AccessLevel.Read,
            4 as IntUserID,
            queryForPost1
          )
          .execute();
        expect(rows).toHaveLength(1);
        expect(rows[0].title).toBe("Post 1");
        if (checkAccessLevel) {
          expect(rows[0].permissions).toBe(AccessLevel.Read);
        }

        // no post returned if user does not have sufficient access, returning array

        rows = await intKeyTable
          .getPermissions(
            intKeyDB,
            AccessLevel.Write,
            4 as IntUserID,
            queryForPost1
          )
          .execute();
        expect(rows).toHaveLength(0);

        // one post returned if user is owner, returning single row

        let row = await intKeyTable
          .getPermissions(
            intKeyDB,
            AccessLevel.Write,
            4 as IntUserID,
            queryForPost4
          )
          .executeTakeFirst();
        expect(row?.title).toBe("Post 4");
        if (checkAccessLevel) {
          expect(row?.permissions).toBe(AccessLevel.Write);
        }

        // no post returned if user has no access, returning single row

        row = await intKeyTable
          .getPermissions(
            intKeyDB,
            AccessLevel.Write,
            4 as IntUserID,
            queryForPost2
          )
          .executeTakeFirst();
        expect(row).toBeUndefined();
      });

      it("deletes permissions rows when user is deleted", async () => {
        await initIntKeyDB();
        const query = intKeyDB
          .selectFrom(intKeyTable.getTableName())
          .select("resourceKey")
          .where("userKey", "=", 5);

        let rows = await query.execute();
        expect(rows).toHaveLength(2);

        await intKeyDB.deleteFrom("users").where("id", "=", 5).execute();

        rows = await query.execute();
        expect(rows).toHaveLength(0);
      });

      it("deletes permissions rows when resource is deleted", async () => {
        await initIntKeyDB();
        const query = intKeyDB
          .selectFrom(intKeyTable.getTableName())
          .select("userKey")
          .where("resourceKey", "=", 3);

        let rows = await query.execute();
        expect(rows).toHaveLength(1);

        await intKeyDB.deleteFrom("posts").where("postID", "=", 3).execute();

        rows = await query.execute();
        expect(rows).toHaveLength(0);
      });
    });

    describe("with string keys", () => {
      testGuardingStrKeySelect<StrUserID, StrPostID>(
        "guardSelectingAccessLevel"
      );
    });
  });

  describe("getMultiplePermissions()", () => {
    describe("with integer keys", () => {
      testGuardingIntKeySelect<IntUserID, IntPostID>("guardQuery");
    });

    describe("with string keys", () => {
      testGuardingStrKeySelect<StrUserID, StrPostID>("guardQuery");
    });
  });
});
