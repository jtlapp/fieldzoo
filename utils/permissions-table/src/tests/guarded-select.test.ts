import { Kysely } from "kysely";

import { IntKeyDB, getIntKeyPermissionsTable } from "./lib/intkey-tables";
import { AccessLevel, createDatabase, ignore } from "./lib/test-util";
import { testGuardingIntKeySelect } from "./lib/test-intkey-select";
import { testGuardingStrKeySelect } from "./lib/test-strkey-select";
import { StrKeyDB, getStrKeyPermissionsTable } from "./lib/strkey-tables";

type IntUserID = number & { readonly __brand: unique symbol };
type IntPostID = number & { readonly __brand: unique symbol };

type StrUserID = string & { readonly __brand: unique symbol };
type StrPostID = string & { readonly __brand: unique symbol };

beforeAll(async () => {
  await createDatabase();
});

describe("PermissionsTable guarded select", () => {
  describe("guardSelectingAccessLevel()", () => {
    describe("usage with integer keys", () => {
      testGuardingIntKeySelect<IntUserID, IntPostID>(
        "guardSelectingAccessLevel"
      );

      ignore("ensure accepts valid base query types", () => {
        const intKeyDB = null as unknown as Kysely<IntKeyDB>;
        const intKeyPermissionsTable = getIntKeyPermissionsTable();

        intKeyPermissionsTable.guardSelectingAccessLevel(
          intKeyDB,
          AccessLevel.Write,
          1 as IntUserID,
          intKeyDB.selectFrom("posts").selectAll("posts")
        );

        intKeyPermissionsTable.guardSelectingAccessLevel(
          intKeyDB,
          AccessLevel.Write,
          1 as IntUserID,
          intKeyDB.selectFrom("posts").select("posts.title")
        );

        intKeyPermissionsTable.guardSelectingAccessLevel(
          intKeyDB,
          AccessLevel.Write,
          1 as IntUserID,
          intKeyDB
            .selectFrom("posts")
            .innerJoin("comments", (join) =>
              join.onRef("comments.postID", "=", "posts.postID")
            )
            .select(["comments.commentID", "comments.comment", "posts.title"])
        );
      });
    });

    describe("usage with string keys", () => {
      testGuardingStrKeySelect<StrUserID, StrPostID>(
        "guardSelectingAccessLevel"
      );

      ignore("ensure accepts valid base query types", () => {
        const strKeyDB = null as unknown as Kysely<StrKeyDB>;
        const strKeyPermissionsTable = getStrKeyPermissionsTable();

        strKeyPermissionsTable.guardSelectingAccessLevel(
          strKeyDB,
          AccessLevel.Write,
          "u1" as StrUserID,
          strKeyDB
            .selectFrom("posts")
            .innerJoin("comments", (join) =>
              join.onRef("comments.postID", "=", "posts.postID")
            )
            .select(["comments.commentID", "comments.comment", "posts.title"])
        );
      });
    });
  });

  describe("guardQuery()", () => {
    describe("usage with integer keys", () => {
      testGuardingIntKeySelect<IntUserID, IntPostID>("guardQuery");

      ignore("ensure accepts valid base query types", () => {
        const intKeyDB = null as unknown as Kysely<IntKeyDB>;
        const intKeyPermissionsTable = getIntKeyPermissionsTable();

        intKeyPermissionsTable.guardQuery(
          intKeyDB,
          AccessLevel.Write,
          1 as IntUserID,
          intKeyDB.selectFrom("posts").selectAll("posts")
        );

        intKeyPermissionsTable.guardQuery(
          intKeyDB,
          AccessLevel.Write,
          1 as IntUserID,
          intKeyDB.selectFrom("posts").select("posts.title")
        );

        intKeyPermissionsTable.guardQuery(
          intKeyDB,
          AccessLevel.Write,
          1 as IntUserID,
          intKeyDB
            .selectFrom("posts")
            .innerJoin("comments", (join) =>
              join.onRef("comments.postID", "=", "posts.postID")
            )
            .select(["comments.commentID", "comments.comment", "posts.title"])
        );
      });
    });
  });

  describe("usage with string keys", () => {
    testGuardingStrKeySelect<StrUserID, StrPostID>("guardQuery");

    ignore("ensure accepts valid base query types", () => {
      const strKeyDB = null as unknown as Kysely<StrKeyDB>;
      const strKeyPermissionsTable = getStrKeyPermissionsTable();

      strKeyPermissionsTable.guardQuery(
        strKeyDB,
        AccessLevel.Write,
        "u1" as StrUserID,
        strKeyDB
          .selectFrom("posts")
          .innerJoin("comments", (join) =>
            join.onRef("comments.postID", "=", "posts.postID")
          )
          .select(["comments.commentID", "comments.comment", "posts.title"])
      );
    });
  });
});
