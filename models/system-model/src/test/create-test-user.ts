/**
 * Create a user for use with tests.
 */

import { UserRepo } from "../repos/user-repo";
import { User } from "../entities/user";
import { Kysely } from "kysely";
import { Database } from "../tables/table-interfaces";

export function createTestUser(
  db: Kysely<Database>,
  displayName: string,
  email: string
): Promise<User> {
  const user = User.castFrom({
    id: "",
    displayName,
    email,
    emailVerified: true,
    userHandle: email.split("@")[0],
    lastLoginAt: null,
    createdAt: new Date(),
    modifiedAt: new Date(),
    disabledAt: null,
  });
  const userRepo = new UserRepo(db);
  return userRepo.add(user);
}
