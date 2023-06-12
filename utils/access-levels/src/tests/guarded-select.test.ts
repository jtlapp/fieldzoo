import { Kysely } from "kysely";

import { IntKeyDB, getIntKeyAccessLevelTable } from "./intkey-tables";
import { AccessLevel, ignore } from "./test-util";
import { testGuardingSelect } from "./test-guarding-select";

type UserID = number & { readonly __brand: unique symbol };
type PostID = number & { readonly __brand: unique symbol };

describe("AccessLevelTable guarded select", () => {
  describe("guardSelectingAccessLevel()", () => {
    testGuardingSelect<UserID, PostID>("guardSelectingAccessLevel", true);

    ignore("ensure accepts valid base query types", () => {
      const db = null as unknown as Kysely<IntKeyDB>;
      const accessLevelTable = getIntKeyAccessLevelTable();

      accessLevelTable.guardSelectingAccessLevel(
        db,
        AccessLevel.Write,
        1 as UserID,
        db.selectFrom("posts").selectAll("posts")
      );

      accessLevelTable.guardSelectingAccessLevel(
        db,
        AccessLevel.Write,
        1 as UserID,
        db.selectFrom("posts").select("posts.title")
      );

      accessLevelTable.guardSelectingAccessLevel(
        db,
        AccessLevel.Write,
        1 as UserID,
        db
          .selectFrom("posts")
          .innerJoin("comments", (join) =>
            join.onRef("comments.postID", "=", "posts.postID")
          )
          .select(["comments.commentID", "comments.comment", "posts.title"])
      );
    });
  });

  describe("guardQuery()", () => {
    testGuardingSelect<UserID, PostID>("guardQuery", false);

    ignore("ensure accepts valid base query types", () => {
      const db = null as unknown as Kysely<IntKeyDB>;
      const accessLevelTable = getIntKeyAccessLevelTable();

      accessLevelTable.guardQuery(
        db,
        AccessLevel.Write,
        1 as UserID,
        db.selectFrom("posts").selectAll("posts")
      );

      accessLevelTable.guardQuery(
        db,
        AccessLevel.Write,
        1 as UserID,
        db.selectFrom("posts").select("posts.title")
      );

      accessLevelTable.guardQuery(
        db,
        AccessLevel.Write,
        1 as UserID,
        db
          .selectFrom("posts")
          .innerJoin("comments", (join) =>
            join.onRef("comments.postID", "=", "posts.postID")
          )
          .select(["comments.commentID", "comments.comment", "posts.title"])
      );
    });
  });
});
