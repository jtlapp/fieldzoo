import { Kysely } from "kysely";

import { IntKeyDB, getIntKeyAccessLevelTable } from "./intkey-tables";
import { AccessLevel, ignore } from "./test-util";
import { testGuardingIntKeySelect } from "./test-intkey-select";
import { testGuardingStrKeySelect } from "./test-strkey-select";
import { StrKeyDB, getStrKeyAccessLevelTable } from "./strkey-tables";

type IntUserID = number & { readonly __brand: unique symbol };
type IntPostID = number & { readonly __brand: unique symbol };

type StrUserID = string & { readonly __brand: unique symbol };
type StrPostID = string & { readonly __brand: unique symbol };

describe("AccessLevelTable guarded select", () => {
  describe("guardSelectingAccessLevel()", () => {
    describe("usage with integer keys", () => {
      testGuardingIntKeySelect<IntUserID, IntPostID>(
        "guardSelectingAccessLevel"
      );

      ignore("ensure accepts valid base query types", () => {
        const intKeyDB = null as unknown as Kysely<IntKeyDB>;
        const intKeyAccessLevelTable = getIntKeyAccessLevelTable();

        intKeyAccessLevelTable.guardSelectingAccessLevel(
          intKeyDB,
          AccessLevel.Write,
          1 as IntUserID,
          intKeyDB.selectFrom("posts").selectAll("posts")
        );

        intKeyAccessLevelTable.guardSelectingAccessLevel(
          intKeyDB,
          AccessLevel.Write,
          1 as IntUserID,
          intKeyDB.selectFrom("posts").select("posts.title")
        );

        intKeyAccessLevelTable.guardSelectingAccessLevel(
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
        const strKeyAccessLevelTable = getStrKeyAccessLevelTable();

        strKeyAccessLevelTable.guardSelectingAccessLevel(
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
        const intKeyAccessLevelTable = getIntKeyAccessLevelTable();

        intKeyAccessLevelTable.guardQuery(
          intKeyDB,
          AccessLevel.Write,
          1 as IntUserID,
          intKeyDB.selectFrom("posts").selectAll("posts")
        );

        intKeyAccessLevelTable.guardQuery(
          intKeyDB,
          AccessLevel.Write,
          1 as IntUserID,
          intKeyDB.selectFrom("posts").select("posts.title")
        );

        intKeyAccessLevelTable.guardQuery(
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
      const strKeyAccessLevelTable = getStrKeyAccessLevelTable();

      strKeyAccessLevelTable.guardQuery(
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
