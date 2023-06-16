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
    maxPublicPermissions: AccessLevel.Read,
    maxUserGrantedPermissions: AccessLevel.Write,
    userTable: "users",
    userIDColumn: "id",
    userIDDataType: "integer",
    resourceTable: "posts",
    resourceIDColumn: "postID",
    resourceIDDataType: "integer",
    sampleUserID: 1 as UserID,
    sampleResourceID: 1 as PostID,
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
  userID: number;
  resourceID: number;
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
