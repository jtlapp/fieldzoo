import { Generated } from "kysely";

import { PermissionsTable } from "../../lib/permissions-table";
import { AccessLevel, createDB } from "./test-util";

export type StrUserID = string & { readonly __brand: unique symbol };
export type StrPostID = string & { readonly __brand: unique symbol };

export async function initStrKeyDB(
  table: PermissionsTable<any, any, any, any, any>
) {
  const strKeyDB = await createDB("text", table);
  await table.create(strKeyDB);

  // user1 owns post 1, has read access to post 2, and no access to post 3
  await strKeyDB
    .insertInto("test_users")
    .values([
      { id: "u1", userHandle: "user1", displayName: "User 1" },
      { id: "u2", userHandle: "user2", displayName: "User 2" },
    ])
    .execute();
  await strKeyDB
    .insertInto("test_posts")
    .values([
      { postID: "p1", ownerID: "u1", title: "Post 1" },
      { postID: "p2", ownerID: "u2", title: "Post 2" },
      { postID: "p3", ownerID: "u2", title: "Post 3" },
    ])
    .execute();
  await table.setPermissions(
    strKeyDB,
    "u1" as StrUserID,
    "p1" as StrPostID,
    AccessLevel.Owner,
    null
  );
  await table.setPermissions(
    strKeyDB,
    "u1" as StrUserID,
    "p2" as StrPostID,
    AccessLevel.Read,
    "u2" as StrUserID
  );

  return strKeyDB;
}

export function getStrKeyPermissionsTable() {
  return new PermissionsTable({
    maxPublicPermissions: AccessLevel.Read,
    maxUserGrantedPermissions: AccessLevel.Write,
    userTable: "test_users",
    userIDColumn: "id",
    userIDDataType: "text",
    resourceTable: "test_posts",
    resourceIDColumn: "postID",
    resourceIDDataType: "text",
    sampleUserID: "foo" as StrUserID,
    sampleResourceID: "foo" as StrPostID,
  });
}

interface Users {
  id: string;
  userHandle: string;
  displayName: string;
}

interface Posts {
  postID: string;
  ownerID: string;
  title: string;
  value?: string;
}

interface PostAccessLevels {
  grantedTo: string;
  resourceID: string;
  permissions: number;
  grantedAt: Date;
  grantedBy: string;
}

interface Comments {
  commentID: Generated<number>;
  postID: string;
  comment: string;
  value?: string;
}

export interface StrKeyDB {
  test_users: Users;
  test_posts: Posts;
  test_posts_permissions: PostAccessLevels;
  test_comments: Comments;
}
