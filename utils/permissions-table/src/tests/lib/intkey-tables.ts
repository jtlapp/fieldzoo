import { Generated } from "kysely";

import { PermissionsTable } from "../../lib/permissions-table";
import { AccessLevel, createDB } from "./test-util";

export type IntUserID = number & { readonly __brand: unique symbol };
export type IntPostID = number & { readonly __brand: unique symbol };

export async function initIntKeyDB(
  table: PermissionsTable<any, any, any, any, any, any, any, any>
) {
  const intKeyDB = await createDB("serial", table);
  await table.create(intKeyDB);

  await intKeyDB
    .insertInto("test_users")
    .values([
      // user1 has no access to any posts
      { userHandle: "user1", displayName: "User 1" },
      // user2 owns post 1, but no assigned permissionss
      { userHandle: "user2", displayName: "User 2" },
      // user3 owns post 2 and post 3, but no assigned permissionss
      { userHandle: "user3", displayName: "User 3" },
      // user4 owns post 4 and has read access to post 1
      { userHandle: "user4", displayName: "User 4" },
      // user5 owns no posts, has read access to post 2, write access to post 3
      { userHandle: "user5", displayName: "User 5" },
    ])
    .execute();

  // test_posts
  await intKeyDB
    .insertInto("test_posts")
    .values([
      { ownerID: 2, title: "Post 1" },
      { ownerID: 3, title: "Post 2" },
      { ownerID: 3, title: "Post 3" },
      { ownerID: 4, title: "Post 4" },
    ])
    .execute();

  // permissions assignments
  await table.setPermissions(
    intKeyDB,
    2 as IntUserID,
    1 as IntPostID,
    AccessLevel.Owner,
    null
  );
  await table.setPermissions(
    intKeyDB,
    3 as IntUserID,
    2 as IntPostID,
    AccessLevel.Owner,
    null
  );
  await table.setPermissions(
    intKeyDB,
    3 as IntUserID,
    3 as IntPostID,
    AccessLevel.Owner,
    null
  );
  await table.setPermissions(
    intKeyDB,
    4 as IntUserID,
    4 as IntPostID,
    AccessLevel.Owner,
    null
  );
  await table.setPermissions(
    intKeyDB,
    4 as IntUserID,
    1 as IntPostID,
    AccessLevel.Read,
    null
  );
  await table.setPermissions(
    intKeyDB,
    5 as IntUserID,
    2 as IntPostID,
    AccessLevel.Read,
    null
  );
  await table.setPermissions(
    intKeyDB,
    5 as IntUserID,
    3 as IntPostID,
    AccessLevel.Write,
    1 as IntUserID
  );

  return intKeyDB;
}

export function getIntKeyPermissionsTable() {
  return new PermissionsTable({
    maxPublicPermissions: AccessLevel.Read,
    maxUserGrantedPermissions: AccessLevel.Write,
    userTable: "test_users",
    userIDColumn: "id",
    userIDDataType: "integer",
    resourceTable: "test_posts",
    resourceIDColumn: "postID",
    resourceIDDataType: "integer",
    sampleUserID: 1 as IntUserID,
    sampleResourceID: 1 as IntPostID,
  });
}

interface Users {
  id: Generated<number>;
  userHandle: string;
  displayName: string;
}

interface Posts {
  postID: Generated<number>;
  ownerID: number;
  title: string;
  value?: string;
}

interface PostAccessLevels {
  grantedTo: number;
  resourceID: number;
  permissions: number;
  grantedAt: Date;
  grantedBy: number;
}

interface Comments {
  commentID: Generated<number>;
  postID: number;
  comment: string;
  value?: string;
}

export interface IntKeyDB {
  test_users: Users;
  test_posts: Posts;
  test_posts_permissions: PostAccessLevels;
  test_comments: Comments;
}
