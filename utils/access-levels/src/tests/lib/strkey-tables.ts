import { Generated } from "kysely";

import { AccessLevelTable } from "../../lib/access-level-table";
import { AccessLevel, createDB } from "./test-util";

export async function createStrKeyDB() {
  return createDB("text");
}

export function getStrKeyAccessLevelTable<
  UserID extends string,
  PostID extends string
>() {
  return new AccessLevelTable({
    ownerAccessLevel: AccessLevel.Write,
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
  accessLevel: number;
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
  posts_access_levels: PostAccessLevels;
  comments: Comments;
}
