import { Generated } from "kysely";

import { PermissionsTable } from "../../lib/permissions-table";
import { AccessLevel, createDB } from "./test-util";

export async function createIntKeyDB(
  permissionsTable: PermissionsTable<any, any, any, any, any>
) {
  const db = await createDB("serial", permissionsTable);
  await permissionsTable.construct(db).execute();
  return db;
}

export function getIntKeyPermissionsTable<
  UserID extends number,
  PostID extends number
>() {
  return new PermissionsTable({
    databaseSyntax: "postgres",
    ownerPermissions: AccessLevel.Owner,
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
