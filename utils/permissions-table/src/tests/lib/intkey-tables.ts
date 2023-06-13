import { Generated } from "kysely";

import { PermissionsTable } from "../../lib/permissions-table";
import { AccessLevel, createDB } from "./test-util";

export async function createIntKeyDB() {
  return createDB("serial");
}

export function getIntKeyPermissionsTable<
  UserID extends number,
  PostID extends number
>() {
  return new PermissionsTable({
    ownerPermissions: AccessLevel.Write,
    userTableName: "users",
    userKeyColumn: "id",
    userKeyDataType: "serial",
    resourceTableName: "posts",
    resourceKeyColumn: "postID",
    resourceKeyDataType: "serial",
    resourceOwnerKeyColumn: "ownerID",
    sampleUserKey: 1 as UserID,
    sampleResourceKey: 1 as PostID,
  });
}

interface Users {
  id: Generated<number>;
  handle: string;
  name: string;
}

interface Posts {
  postID: Generated<number>;
  ownerID: number;
  title: string;
  value?: string;
}

interface PostAccessLevels {
  userKey: number;
  resourceKey: number;
  permissions: number;
}

interface Comments {
  commentID: Generated<number>;
  postID: number;
  comment: string;
  value?: string;
}

export interface IntKeyDB {
  users: Users;
  posts: Posts;
  posts_permissions: PostAccessLevels;
  comments: Comments;
}
