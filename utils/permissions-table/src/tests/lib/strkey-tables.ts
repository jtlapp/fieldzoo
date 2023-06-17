import { Generated } from "kysely";

import { PermissionsTable } from "../../lib/permissions-table";
import { AccessLevel, createDB } from "./test-util";

export async function initStrKeyDB<
  StrUserID extends string,
  StrPostID extends string
>(strKeyTable: PermissionsTable<any, any, any, any, any>) {
  const strKeyDB = await createDB("text", strKeyTable);
  await strKeyTable.create(strKeyDB);

  // user1 owns post 1, has read access to post 2, and no access to post 3
  await strKeyDB
    .insertInto("users")
    .values([
      { id: "u1", handle: "user1", name: "User 1" },
      { id: "u2", handle: "user2", name: "User 2" },
    ])
    .execute();
  await strKeyDB
    .insertInto("posts")
    .values([
      { postID: "p1", ownerID: "u1", title: "Post 1" },
      { postID: "p2", ownerID: "u2", title: "Post 2" },
      { postID: "p3", ownerID: "u2", title: "Post 3" },
    ])
    .execute();
  await strKeyTable.setPermissions(
    strKeyDB,
    "u1" as StrUserID,
    "p1" as StrPostID,
    AccessLevel.Owner,
    null
  );
  await strKeyTable.setPermissions(
    strKeyDB,
    "u1" as StrUserID,
    "p2" as StrPostID,
    AccessLevel.Read,
    "u2" as StrUserID
  );

  return strKeyDB;
}

export function getStrKeyPermissionsTable<
  UserID extends string,
  PostID extends string
>() {
  return new PermissionsTable({
    maxPublicPermissions: AccessLevel.Read,
    maxUserGrantedPermissions: AccessLevel.Write,
    userTable: "users",
    userIDColumn: "id",
    userIDDataType: "text",
    resourceTable: "posts",
    resourceIDColumn: "postID",
    resourceIDDataType: "text",
    sampleUserID: "foo" as UserID,
    sampleResourceID: "foo" as PostID,
  });
}

interface Users {
  id: string;
  handle: string;
  name: string;
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
  users: Users;
  posts: Posts;
  posts_permissions: PostAccessLevels;
  comments: Comments;
}
