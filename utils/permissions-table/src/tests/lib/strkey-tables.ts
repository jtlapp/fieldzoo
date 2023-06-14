import { Generated } from "kysely";

import { PermissionsTable } from "../../lib/permissions-table";
import { AccessLevel, createDB } from "./test-util";

export async function createStrKeyDB() {
  return createDB("text");
}

export function getStrKeyPermissionsTable<
  UserID extends string,
  PostID extends string
>() {
  return new PermissionsTable({
    databaseSyntax: "postgres",
    ownerPermissions: AccessLevel.Write,
    userTableName: "users",
    userKeyColumn: "id",
    userKeyDataType: "text",
    resourceTableName: "posts",
    resourceKeyColumn: "postID",
    resourceKeyDataType: "text",
    resourceOwnerKeyColumn: "ownerID",
    sampleUserKey: "foo" as UserID,
    sampleResourceKey: "foo" as PostID,
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
  userKey: string;
  resourceKey: string;
  permissions: number;
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
